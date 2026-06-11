import { Request, Response } from 'express';
import { Op, fn, col } from 'sequelize';
import { User, Student, Class, Subject, Attendance, FeePayment, FeeStructure, Exam, Result, Timetable, Assignment, Submission } from '../models';

export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    // Stats Cards
    const totalStudents = await Student.count({ where: { tenantId } });
    const totalTeachers = await User.count({ where: { tenantId, role: 'teacher' } });
    const totalClasses = await Class.count({ where: { tenantId } });
    
    // Fee Collection Sum
    const payments = await FeePayment.findAll({
      where: { tenantId },
      attributes: ['amountPaid', 'paymentDate']
    });
    const totalFeesCollected = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);

    // Monthly Fee Collection Chart Data (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyPayments = await FeePayment.findAll({
      where: {
        tenantId,
        paymentDate: { [Op.gte]: sixMonthsAgo }
      },
      attributes: [
        [fn('DATE_FORMAT', col('payment_date'), '%Y-%m'), 'month'],
        [fn('SUM', col('amount_paid')), 'totalCollected']
      ],
      group: [fn('DATE_FORMAT', col('payment_date'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('payment_date'), '%Y-%m'), 'ASC']]
    });

    // Attendance distribution for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const attendanceStats = await Attendance.findAll({
      where: {
        tenantId,
        date: { [Op.gte]: startOfMonth }
      },
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status']
    });

    // Recent activities (Latest 5 users or fee payments)
    const recentPayments = await FeePayment.findAll({
      where: { tenantId },
      include: [{ model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['name'] }] }],
      limit: 5,
      order: [['paymentDate', 'DESC']]
    });

    const activities = recentPayments.map(p => ({
      id: p.id,
      type: 'fee_payment',
      title: `Fee payment received`,
      description: `${p.student.user.name} paid $${p.amountPaid} via ${p.method}`,
      date: p.paymentDate,
    }));

    return res.status(200).json({
      stats: {
        students: totalStudents,
        teachers: totalTeachers,
        classes: totalClasses,
        feesCollected: totalFeesCollected
      },
      charts: {
        monthlyFees: monthlyPayments,
        attendancePie: attendanceStats.map(stat => ({
          status: stat.status,
          count: Number(stat.getDataValue('count' as any))
        }))
      },
      activities
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to build admin dashboard', error: String(error) });
  }
};

export const getTeacherDashboard = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user?.userId;

    // 1. Get subjects taught by this teacher
    const subjects = await Subject.findAll({ where: { tenantId, teacherId: userId } });
    const classIds = [...new Set(subjects.map(s => s.classId))];

    // 2. Timetable for today
    const dayOfWeek = new Date().getDay(); // 0 (Sun) - 6 (Sat)
    // Map to 1 (Mon) - 6 (Sat)
    const apiDay = dayOfWeek === 0 ? 7 : dayOfWeek;

    const todayTimetable = await Timetable.findAll({
      where: {
        tenantId,
        classId: { [Op.in]: classIds },
        dayOfWeek: apiDay
      },
      include: [
        { model: Subject, as: 'subject', attributes: ['name', 'code', 'teacherId'] },
        { model: Class, as: 'class', attributes: ['name', 'section'] }
      ],
      order: [['startTime', 'ASC']]
    });

    // Filter to subjects taught by this teacher
    const todaySchedule = todayTimetable.filter(slot => slot.subject.teacherId === userId);

    // 3. Pending Assignments
    const teacherAssignments = await Assignment.findAll({
      where: { tenantId, createdBy: userId },
      include: [{ model: Subject, as: 'subject', attributes: ['name'] }],
      order: [['dueDate', 'DESC']],
      limit: 5
    });

    // 4. Attendance Summary for classes managed by this teacher
    const managedClasses = await Class.findAll({ where: { tenantId, classTeacherId: userId } });
    const managedClassIds = managedClasses.map(c => c.id);

    const students = await Student.findAll({ where: { tenantId, classId: { [Op.in]: managedClassIds } } });
    const studentIds = students.map(s => s.id);

    const presentCount = await Attendance.count({
      where: {
        tenantId,
        studentId: { [Op.in]: studentIds },
        date: new Date().toISOString().split('T')[0],
        status: 'present'
      }
    });

    return res.status(200).json({
      todaySchedule,
      assignments: teacherAssignments,
      attendanceSummary: {
        totalStudents: students.length,
        presentToday: presentCount,
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to build teacher dashboard', error: String(error) });
  }
};

export const getStudentDashboard = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user?.userId;

    const student = await Student.findOne({
      where: { tenantId, userId },
      include: [{ model: Class, as: 'class', attributes: ['name', 'section'] }]
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Attendance gauge calculation
    const totalDays = await Attendance.count({ where: { tenantId, studentId: student.id } });
    const presentDays = await Attendance.count({
      where: {
        tenantId,
        studentId: student.id,
        status: { [Op.in]: ['present', 'late'] }
      }
    });
    const attendancePercentage = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(2)) : 100.0;

    // Upcoming exams (next 15 days)
    const upcomingExams = await Exam.findAll({
      where: {
        tenantId,
        classId: student.classId,
        startDate: { [Op.gte]: new Date() }
      },
      order: [['startDate', 'ASC']],
      limit: 3
    });

    // Pending Fees
    const feeStructures = await FeeStructure.findAll({ where: { tenantId, classId: student.classId } });
    const payments = await FeePayment.findAll({ where: { tenantId, studentId: student.id } });

    const totalDue = feeStructures.reduce((sum, fs) => sum + Number(fs.amount), 0);
    const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amountPaid), 0);
    const pendingFees = Math.max(0, totalDue - totalPaid);

    // Recent results
    const recentResults = await Result.findAll({
      where: { tenantId, studentId: student.id },
      include: [
        { model: Subject, as: 'subject', attributes: ['name', 'code'] },
        { model: Exam, as: 'exam', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    return res.status(200).json({
      className: `${student.class.name}-${student.class.section}`,
      attendancePercentage,
      upcomingExams,
      pendingFees,
      recentResults
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to build student dashboard', error: String(error) });
  }
};

export const getParentDashboard = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const parentId = req.user?.userId;

    // Find children
    const children = await Student.findAll({
      where: { tenantId, parentId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profilePhoto'] }]
    });

    if (children.length === 0) {
      return res.status(200).json({ children: [], message: 'No children linked to this parent account' });
    }

    const summaries = [];

    for (const child of children) {
      // Calculate attendance %
      const totalDays = await Attendance.count({ where: { tenantId, studentId: child.id } });
      const presentDays = await Attendance.count({
        where: {
          tenantId,
          studentId: child.id,
          status: { [Op.in]: ['present', 'late'] }
        }
      });
      const attendancePercentage = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(2)) : 100.0;

      // Fees due
      const structures = await FeeStructure.findAll({ where: { tenantId, classId: child.classId } });
      const payments = await FeePayment.findAll({ where: { tenantId, studentId: child.id } });
      const totalDue = structures.reduce((sum, s) => sum + Number(s.amount), 0);
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
      const pendingFees = Math.max(0, totalDue - totalPaid);

      // Latest Exam Result
      const latestResult = await Result.findOne({
        where: { tenantId, studentId: child.id },
        include: [{ model: Exam, as: 'exam', attributes: ['name'] }],
        order: [['createdAt', 'DESC']]
      });

      summaries.push({
        studentId: child.id,
        name: child.user.name,
        profilePhoto: child.user.profilePhoto,
        admissionNo: child.admissionNo,
        attendancePercentage,
        pendingFees,
        latestResult: latestResult ? {
          examName: latestResult.exam.name,
          grade: latestResult.grade,
          marks: latestResult.marksObtained
        } : null
      });
    }

    return res.status(200).json({
      children: summaries
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to build parent dashboard', error: String(error) });
  }
};
