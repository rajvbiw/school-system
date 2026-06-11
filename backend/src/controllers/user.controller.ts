import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { User, Student, Class, Attendance, FeeStructure, FeePayment } from '../models';
import { logAudit } from '../utils/audit.utils';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { role, classId } = req.query;

    const queryOptions: any = {
      where: { tenantId },
      attributes: { exclude: ['passwordHash'] },
    };

    if (role) {
      queryOptions.where.role = role;
    }

    if (classId) {
      // Find users who are students in this class
      const students = await Student.findAll({
        where: { tenantId, classId: parseInt(classId as string) },
        attributes: ['userId'],
      });
      const userIds = students.map(s => s.userId);
      queryOptions.where.id = { [Op.in]: userIds };
    }

    const users = await User.findAll(queryOptions);
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve users', error: String(error) });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { name, email, password, role, phone, profilePhoto } = req.body;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context is missing' });
    }
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required user fields' });
    }

    const existing = await User.findOne({ where: { tenantId, email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered under this school' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      tenantId,
      name,
      email,
      passwordHash,
      role,
      phone,
      profilePhoto,
      isActive: true,
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CREATE',
      tableName: 'users',
      recordId: user.id,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create user', error: String(error) });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { name, email, phone, profilePhoto, isActive } = req.body;

    const user = await User.findOne({ where: { id, tenantId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({
      name: name !== undefined ? name : user.name,
      email: email !== undefined ? email : user.email,
      phone: phone !== undefined ? phone : user.phone,
      profilePhoto: profilePhoto !== undefined ? profilePhoto : user.profilePhoto,
      isActive: isActive !== undefined ? isActive : user.isActive,
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'UPDATE',
      tableName: 'users',
      recordId: user.id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profilePhoto: user.profilePhoto,
      isActive: user.isActive,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user', error: String(error) });
  }
};

export const bulkImportUsers = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { csvData } = req.body; // Expecting CSV as a string

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context is missing' });
    }
    if (!csvData) {
      return res.status(400).json({ message: 'csvData string is required' });
    }

    const lines = csvData.split('\n');
    const importedUsers = [];
    const errors = [];

    // Header validation expected: name,email,password,role,phone
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',');
      if (parts.length < 4) {
        errors.push(`Row ${i + 1}: Insufficient fields`);
        continue;
      }

      const [name, email, password, role, phone] = parts.map((p: string) => p?.trim());

      if (!name || !email || !password || !role) {
        errors.push(`Row ${i + 1}: Missing required values (name, email, password, role)`);
        continue;
      }

      // Check duplicate
      const existing = await User.findOne({ where: { tenantId, email } });
      if (existing) {
        errors.push(`Row ${i + 1}: User with email '${email}' already exists`);
        continue;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        tenantId,
        name,
        email,
        passwordHash,
        role: role as any,
        phone,
        isActive: true,
      });

      importedUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }

    await logAudit({
      userId: req.user?.userId,
      action: 'CREATE',
      tableName: 'users',
      recordId: 0, // Bulk marker
      ipAddress: req.ip,
    });

    return res.status(200).json({
      message: `Successfully processed CSV. Imported: ${importedUsers.length}, Errors: ${errors.length}`,
      imported: importedUsers,
      errors,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Bulk import failed', error: String(error) });
  }
};

export const getStudents = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const classId = req.query.classId;

    const offset = (page - 1) * limit;

    const userWhereClause: any = {};
    if (search) {
      userWhereClause.name = { [Op.like]: `%${search}%` };
    }

    const studentWhereClause: any = { tenantId };
    if (search) {
      studentWhereClause[Op.or] = [
        { admissionNo: { [Op.like]: `%${search}%` } },
        { '$user.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    if (classId) {
      studentWhereClause.classId = parseInt(classId as string);
    }

    const { count, rows } = await Student.findAndCountAll({
      where: studentWhereClause,
      include: [
        { model: User, as: 'user', where: userWhereClause, attributes: ['id', 'name', 'email', 'phone', 'profilePhoto', 'isActive'] },
        { model: Class, as: 'class', attributes: ['id', 'name', 'section', 'grade'] },
        { model: User, as: 'parent', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      offset,
      limit,
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      students: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit,
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to query students', error: String(error) });
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    const student = await Student.findOne({
      where: { id, tenantId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'profilePhoto', 'isActive'] },
        { model: Class, as: 'class', attributes: ['id', 'name', 'section', 'grade'] },
        { model: User, as: 'parent', attributes: ['id', 'name', 'email', 'phone'] }
      ],
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Compute Attendance %
    const totalDays = await Attendance.count({ where: { tenantId, studentId: student.id } });
    const presentDays = await Attendance.count({
      where: {
        tenantId,
        studentId: student.id,
        status: { [Op.in]: ['present', 'late'] }
      }
    });
    const attendancePercentage = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(2)) : 100.0;

    // Compute Fee Status
    const feeStructures = await FeeStructure.findAll({ where: { tenantId, classId: student.classId } });
    const payments = await FeePayment.findAll({ where: { tenantId, studentId: student.id } });

    const totalDue = feeStructures.reduce((sum, fs) => sum + Number(fs.amount), 0);
    const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amountPaid), 0);
    const pendingFees = Math.max(0, totalDue - totalPaid);

    return res.status(200).json({
      student,
      metrics: {
        attendancePercentage,
        totalDue,
        totalPaid,
        pendingFees,
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch student details', error: String(error) });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const {
      name, email, password, phone, profilePhoto, // User details
      admissionNo, classId, parentId, dob, gender, bloodGroup, address, admissionDate // Student details
    } = req.body;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context is missing' });
    }
    if (!name || !email || !password || !admissionNo || !classId) {
      return res.status(400).json({ message: 'Missing required student fields' });
    }

    // Verify Class exists
    const classRecord = await Class.findOne({ where: { id: classId, tenantId } });
    if (!classRecord) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ where: { tenantId, email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already used' });
    }

    // Check duplicate admission number
    const existingStudent = await Student.findOne({ where: { tenantId, admissionNo } });
    if (existingStudent) {
      return res.status(400).json({ message: 'Admission number already exists' });
    }

    // Create User record
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      tenantId,
      name,
      email,
      passwordHash,
      role: 'student',
      phone,
      profilePhoto,
      isActive: true,
    });

    // Create Student profile
    const student = await Student.create({
      tenantId,
      userId: user.id,
      admissionNo,
      classId,
      parentId: parentId || null,
      dob: dob || null,
      gender,
      bloodGroup,
      address,
      admissionDate: admissionDate || new Date(),
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CREATE',
      tableName: 'students',
      recordId: student.id,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      studentId: student.id,
      name: user.name,
      email: user.email,
      admissionNo: student.admissionNo,
      classId: student.classId,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create student profile', error: String(error) });
  }
};
