import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Attendance, AttendanceSummary, Student, User, Class } from '../models';
import { emitToClass } from '../services/socket.service';
import { logAudit } from '../utils/audit.utils';

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { class_id, date } = req.query;

    if (!class_id || !date) {
      return res.status(400).json({ message: 'class_id and date are required' });
    }

    // Find all students in class
    const students = await Student.findAll({
      where: { tenantId, classId: parseInt(class_id as string) },
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
    });

    const studentIds = students.map(s => s.id);

    // Fetch existing attendance records
    const records = await Attendance.findAll({
      where: {
        tenantId,
        studentId: { [Op.in]: studentIds },
        date: String(date)
      }
    });

    // Merge students with their attendance status
    const list = students.map(student => {
      const record = records.find(r => r.studentId === student.id);
      return {
        studentId: student.id,
        name: student.user.name,
        admissionNo: student.admissionNo,
        status: record ? record.status : null,
        attendanceId: record ? record.id : null,
      };
    });

    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch attendance', error: String(error) });
  }
};

export const bulkMarkAttendance = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const markerId = req.user?.userId;
    const { classId, date, records, subjectId } = req.body; // records: [{ studentId: 1, status: 'present' }]

    if (!classId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'classId, date, and records array are required' });
    }

    const [year, monthStr] = date.split('-');
    const month = parseInt(monthStr);
    const parsedYear = parseInt(year);

    const upsertPromises = records.map(async (rec: { studentId: number; status: 'present' | 'absent' | 'late' | 'holiday' }) => {
      // 1. Check if record exists
      const existing = await Attendance.findOne({
        where: { tenantId, studentId: rec.studentId, date, ...(subjectId ? { subjectId } : {}) }
      });

      if (existing) {
        return existing.update({ status: rec.status, markedBy: markerId || 1 });
      } else {
        return Attendance.create({
          tenantId,
          studentId: rec.studentId,
          subjectId,
          date,
          status: rec.status,
          markedBy: markerId || 1
        });
      }
    });

    await Promise.all(upsertPromises);

    // 2. Update AttendanceSummary records for the students
    const updateSummaryPromises = records.map(async (rec: { studentId: number }) => {
      const studentId = rec.studentId;

      // Count stats for this month and year
      const startDate = `${year}-${monthStr}-01`;
      const endDate = `${year}-${monthStr}-31`; // SQL handles dates correctly

      const totalDays = await Attendance.count({
        where: {
          tenantId,
          studentId,
          date: { [Op.between]: [startDate, endDate] }
        }
      });

      const presentDays = await Attendance.count({
        where: {
          tenantId,
          studentId,
          date: { [Op.between]: [startDate, endDate] },
          status: { [Op.in]: ['present', 'late'] }
        }
      });

      const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

      const summary = await AttendanceSummary.findOne({
        where: { tenantId, studentId, month, year: parsedYear }
      });

      if (summary) {
        return summary.update({ totalDays, presentDays, percentage });
      } else {
        return AttendanceSummary.create({
          tenantId,
          studentId,
          month,
          year: parsedYear,
          totalDays,
          presentDays,
          percentage
        });
      }
    });

    await Promise.all(updateSummaryPromises);

    // 3. Emit Real-time update
    const totalP = records.filter(r => r.status === 'present').length;
    emitToClass(classId, 'attendance_marked', {
      classId,
      date,
      summary: {
        total: records.length,
        present: totalP,
        absent: records.length - totalP,
      }
    });

    await logAudit({
      userId: markerId,
      action: 'UPDATE',
      tableName: 'attendance',
      recordId: classId,
      ipAddress: req.ip,
    });

    return res.status(200).json({ message: 'Attendance recorded successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to record attendance', error: String(error) });
  }
};

export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'month and year are required' });
    }

    const monthStr = String(month).padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    const endDate = `${year}-${monthStr}-31`;

    const records = await Attendance.findAll({
      where: {
        tenantId,
        studentId: id,
        date: { [Op.between]: [startDate, endDate] }
      },
      order: [['date', 'ASC']]
    });

    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch student attendance', error: String(error) });
  }
};

export const getAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { class_id, month, year } = req.query;

    if (!class_id || !month || !year) {
      return res.status(400).json({ message: 'class_id, month, and year are required' });
    }

    const students = await Student.findAll({
      where: { tenantId, classId: parseInt(class_id as string) }
    });
    const studentIds = students.map(s => s.id);

    const summaries = await AttendanceSummary.findAll({
      where: {
        tenantId,
        studentId: { [Op.in]: studentIds },
        month: parseInt(month as string),
        year: parseInt(year as string)
      },
      include: [{
        model: Student,
        as: 'student',
        include: [{ model: User, as: 'user', attributes: ['name'] }]
      }]
    });

    return res.status(200).json(summaries);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch attendance summary', error: String(error) });
  }
};
