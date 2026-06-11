import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Exam, ExamSubject, Result, Student, User, Subject, Timetable, Assignment, Submission, Class, Tenant, AttendanceSummary } from '../models';
import { cacheGet, cacheSet, cacheDel } from '../utils/redis.utils';
import { logAudit } from '../utils/audit.utils';

// EXAMS

export const getExams = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { class_id } = req.query;

    const whereClause: any = { tenantId };
    if (class_id) {
      whereClause.classId = parseInt(class_id as string);
    }

    const exams = await Exam.findAll({
      where: whereClause,
      include: [
        { model: Class, as: 'class', attributes: ['name', 'section'] },
        { model: ExamSubject, as: 'examSubjects', include: [{ model: Subject, as: 'subject', attributes: ['name', 'code'] }] }
      ]
    });

    return res.status(200).json(exams);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch exams', error: String(error) });
  }
};

export const createExam = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { name, classId, startDate, endDate, type, subjects } = req.body; // subjects: [{ subjectId, examDate, maxMarks, passMarks, durationMins }]

    if (!name || !classId || !startDate || !endDate || !type || !subjects || !Array.isArray(subjects)) {
      return res.status(400).json({ message: 'Missing exam creation fields' });
    }

    const exam = await Exam.create({
      tenantId,
      name,
      classId,
      startDate,
      endDate,
      type
    });

    const examSubjectsPromises = subjects.map(sub =>
      ExamSubject.create({
        examId: exam.id,
        subjectId: sub.subjectId,
        examDate: sub.examDate,
        maxMarks: sub.maxMarks,
        passMarks: sub.passMarks,
        durationMins: sub.durationMins
      })
    );

    await Promise.all(examSubjectsPromises);

    await logAudit({
      userId: req.user?.userId,
      action: 'CREATE',
      tableName: 'exams',
      recordId: exam.id,
      ipAddress: req.ip,
    });

    return res.status(201).json(exam);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create exam', error: String(error) });
  }
};

// RESULTS

export const getResults = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { exam_id, class_id } = req.query;

    if (!exam_id) {
      return res.status(400).json({ message: 'exam_id is required' });
    }

    const whereClause: any = { tenantId, examId: parseInt(exam_id as string) };
    
    // Filter student records if class is requested
    const studentInclude: any = {
      model: Student,
      as: 'student',
      include: [{ model: User, as: 'user', attributes: ['name'] }]
    };

    if (class_id) {
      studentInclude.where = { classId: parseInt(class_id as string) };
    }

    const results = await Result.findAll({
      where: whereClause,
      include: [
        studentInclude,
        { model: Subject, as: 'subject', attributes: ['name', 'code'] },
        { model: Exam, as: 'exam', attributes: ['name'] }
      ]
    });

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve results', error: String(error) });
  }
};

export const bulkUploadResults = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { examId, subjectId, marksList } = req.body; // marksList: [{ studentId, marksObtained, remarks }]

    if (!examId || !subjectId || !marksList || !Array.isArray(marksList)) {
      return res.status(400).json({ message: 'examId, subjectId, and marksList array are required' });
    }

    // Load max/pass marks to determine grade
    const examSubject = await ExamSubject.findOne({ where: { examId, subjectId } });
    if (!examSubject) {
      return res.status(404).json({ message: 'Subject is not assigned to this exam' });
    }

    const uploadPromises = marksList.map(async (item: { studentId: number; marksObtained: number; remarks?: string }) => {
      const percentage = (item.marksObtained / examSubject.maxMarks) * 100;
      
      // Determine grade
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B';
      else if (percentage >= 60) grade = 'C';
      else if (percentage >= 50) grade = 'D';
      else if (percentage >= examSubject.passMarks / examSubject.maxMarks * 100) grade = 'E';

      const existing = await Result.findOne({
        where: { tenantId, studentId: item.studentId, examId, subjectId }
      });

      // Invalidate Cache for this student
      const cacheKey = `tenant:${tenantId}:results:student:${item.studentId}`;
      await cacheDel(cacheKey);

      if (existing) {
        return existing.update({
          marksObtained: item.marksObtained,
          grade,
          remarks: item.remarks
        });
      } else {
        return Result.create({
          tenantId,
          studentId: item.studentId,
          examId,
          subjectId,
          marksObtained: item.marksObtained,
          grade,
          remarks: item.remarks
        });
      }
    });

    await Promise.all(uploadPromises);

    await logAudit({
      userId: req.user?.userId,
      action: 'UPDATE',
      tableName: 'results',
      recordId: examId,
      ipAddress: req.ip,
    });

    return res.status(200).json({ message: 'Results uploaded successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upload results', error: String(error) });
  }
};

export const getStudentResults = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params; // Student ID

    const cacheKey = `tenant:${tenantId}:results:student:${id}`;
    const cachedData = await cacheGet(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const results = await Result.findAll({
      where: { tenantId, studentId: id },
      include: [
        { model: Exam, as: 'exam', attributes: ['name', 'type', 'startDate'] },
        { model: Subject, as: 'subject', attributes: ['name', 'code'] }
      ]
    });

    // Cache results for 1 hour
    await cacheSet(cacheKey, JSON.stringify(results), 3600);

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch student results', error: String(error) });
  }
};

export const getReportCard = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { student_id, exam_id } = req.params;

    const tenant = await Tenant.findByPk(tenantId);
    const student = await Student.findOne({
      where: { id: student_id, tenantId },
      include: [
        { model: User, as: 'user', attributes: ['name'] },
        { model: Class, as: 'class', attributes: ['name', 'section', 'grade'] }
      ]
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const exam = await Exam.findOne({
      where: { id: exam_id, tenantId },
      attributes: ['id', 'name', 'type']
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const results = await Result.findAll({
      where: { tenantId, studentId: student_id, examId: exam_id },
      include: [
        { model: Subject, as: 'subject', attributes: ['name', 'code'] }
      ]
    });

    const subjectsInfo = await ExamSubject.findAll({
      where: { examId: exam_id },
      attributes: ['subjectId', 'maxMarks', 'passMarks']
    });

    const cardDetails = results.map(res => {
      const subInfo = subjectsInfo.find(info => info.subjectId === res.subjectId);
      return {
        subjectCode: res.subject?.code,
        subjectName: res.subject?.name,
        marksObtained: Number(res.marksObtained),
        maxMarks: subInfo ? Number(subInfo.maxMarks) : 100,
        passMarks: subInfo ? Number(subInfo.passMarks) : 33,
        grade: res.grade,
        remarks: res.remarks || '',
      };
    });

    const totalMarks = cardDetails.reduce((sum, item) => sum + item.marksObtained, 0);
    const totalMax = cardDetails.reduce((sum, item) => sum + item.maxMarks, 0);
    const percentage = totalMax > 0 ? Number(((totalMarks / totalMax) * 100).toFixed(2)) : 0;

    return res.status(200).json({
      school: {
        name: tenant?.name,
        logoUrl: tenant?.logoUrl,
        primaryColor: tenant?.primaryColor
      },
      student: {
        name: student.user.name,
        admissionNo: student.admissionNo,
        class: `${student.class.name}-${student.class.section}`,
        grade: student.class.grade
      },
      examName: exam.name,
      results: cardDetails,
      summary: {
        totalMarks,
        totalMax,
        percentage,
        gpa: (percentage / 20).toFixed(2) // Mock GPA calculation
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to construct report card', error: String(error) });
  }
};

// TIMETABLE

export const getTimetable = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { class_id } = req.query;

    if (!class_id) {
      return res.status(400).json({ message: 'class_id is required' });
    }

    const timetable = await Timetable.findAll({
      where: { tenantId, classId: parseInt(class_id as string) },
      include: [{ model: Subject, as: 'subject', attributes: ['name', 'code', 'teacherId'] }]
    });

    return res.status(200).json(timetable);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve timetable', error: String(error) });
  }
};

// ASSIGNMENTS & SUBMISSIONS

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const creatorId = req.user?.userId;
    const { subjectId, title, description, dueDate, fileUrl } = req.body;

    if (!subjectId || !title || !dueDate) {
      return res.status(400).json({ message: 'subjectId, title, and dueDate are required' });
    }

    const assignment = await Assignment.create({
      tenantId,
      subjectId,
      title,
      description,
      dueDate,
      fileUrl,
      createdBy: creatorId || 1
    });

    await logAudit({
      userId: creatorId,
      action: 'CREATE',
      tableName: 'assignments',
      recordId: assignment.id,
      ipAddress: req.ip,
    });

    return res.status(201).json(assignment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create assignment', error: String(error) });
  }
};

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { subject_id } = req.query;

    const whereClause: any = { tenantId };
    if (subject_id) {
      whereClause.subjectId = parseInt(subject_id as string);
    }

    const assignments = await Assignment.findAll({
      where: whereClause,
      include: [
        { model: Subject, as: 'subject', attributes: ['name', 'code'] },
        { model: Submission, as: 'submissions', attributes: ['id', 'studentId', 'submittedAt', 'marks'] }
      ],
      order: [['dueDate', 'ASC']]
    });

    return res.status(200).json(assignments);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch assignments', error: String(error) });
  }
};

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user?.userId;

    const { assignmentId, fileUrl } = req.body;

    if (!assignmentId || !fileUrl) {
      return res.status(400).json({ message: 'assignmentId and fileUrl are required' });
    }

    // Resolve student account ID
    const student = await Student.findOne({ where: { tenantId, userId } });
    if (!student) {
      return res.status(403).json({ message: 'Only students can submit assignments' });
    }

    const submission = await Submission.create({
      assignmentId,
      studentId: student.id,
      submittedAt: new Date(),
      fileUrl
    });

    await logAudit({
      userId,
      action: 'CREATE',
      tableName: 'submissions',
      recordId: submission.id,
      ipAddress: req.ip,
    });

    return res.status(201).json(submission);
  } catch (error) {
    return res.status(500).json({ message: 'Assignment submission failed', error: String(error) });
  }
};

// AI PERFORMANCE ANALYSIS & DIAGNOSTICS
export const getAIPerformanceAnalysis = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;

    // Find class context
    const classWhere: any = { tenantId };
    if (classId) {
      classWhere.id = classId;
    }
    const classes = await Class.findAll({ where: classWhere });
    const classIds = classes.map(c => c.id);

    // Fetch all students in these classes
    const students = await Student.findAll({
      where: { tenantId, classId: { [Op.in]: classIds } },
      include: [
        { model: User, as: 'user', attributes: ['name', 'email'] },
        { model: Class, as: 'class', attributes: ['name', 'section'] }
      ]
    });

    if (students.length === 0) {
      return res.status(200).json({ classAverage: {}, belowAverageStudents: [] });
    }

    const studentIds = students.map(s => s.id);

    // Fetch all results for these students
    const results = await Result.findAll({
      where: { tenantId, studentId: { [Op.in]: studentIds } },
      include: [
        { model: Subject, as: 'subject', attributes: ['name'] }
      ]
    });

    // Fetch attendance summaries for these students to calculate attendance %
    const summaries = await AttendanceSummary.findAll({
      where: { tenantId, studentId: { [Op.in]: studentIds } }
    });

    // Map student attendance
    const attendanceMap: Record<number, { totalDays: number; presentDays: number }> = {};
    summaries.forEach(summary => {
      if (!attendanceMap[summary.studentId]) {
        attendanceMap[summary.studentId] = { totalDays: 0, presentDays: 0 };
      }
      attendanceMap[summary.studentId].totalDays += Number(summary.totalDays);
      attendanceMap[summary.studentId].presentDays += Number(summary.presentDays);
    });

    // Calculate averages per subject
    const subjectScores: Record<string, number[]> = {};
    results.forEach(res => {
      const subjectName = res.subject?.name || 'Unknown';
      if (!subjectScores[subjectName]) {
        subjectScores[subjectName] = [];
      }
      subjectScores[subjectName].push(Number(res.marksObtained));
    });

    const classAverage: Record<string, number> = {};
    Object.keys(subjectScores).forEach(subName => {
      const scores = subjectScores[subName];
      const sum = scores.reduce((a, b) => a + b, 0);
      classAverage[subName] = Number((sum / scores.length).toFixed(2));
    });

    // Group student's individual scores
    const studentScores: Record<number, Record<string, number>> = {};
    results.forEach(res => {
      const subjectName = res.subject?.name || 'Unknown';
      if (!studentScores[res.studentId]) {
        studentScores[res.studentId] = {};
      }
      studentScores[res.studentId][subjectName] = Number(res.marksObtained);
    });

    // Analyze below average students
    const belowAverageStudents: any[] = [];

    students.forEach(student => {
      const scores = studentScores[student.id] || {};
      const lowSubjects: any[] = [];

      Object.keys(scores).forEach(subName => {
        const studentScore = scores[subName];
        const average = classAverage[subName];
        if (studentScore < average) {
          lowSubjects.push({
            subjectName: subName,
            marks: studentScore,
            classAverage: average,
            deviation: Number((studentScore - average).toFixed(2))
          });
        }
      });

      if (lowSubjects.length > 0) {
        // Compute attendance %
        const att = attendanceMap[student.id];
        const attendancePercentage = att && att.totalDays > 0 
          ? Number(((att.presentDays / att.totalDays) * 100).toFixed(2))
          : 90.0; // Fallback if no records

        // Generate AI Insight text
        const lowSubListStr = lowSubjects.map(ls => `${ls.subjectName} (${ls.marks}% vs Class Avg ${ls.classAverage}%)`).join(', ');
        
        let recommendation = '';
        if (attendancePercentage < 80) {
          recommendation = `Due to low attendance of ${attendancePercentage}%, primary intervention should focus on attendance consistency. Set up parent counseling.`;
        } else {
          recommendation = `With a healthy attendance of ${attendancePercentage}%, the student should attend focused remedial classes and complete extra practice assignments.`;
        }

        const aiInsights = `AI Diagnosis: ${student.user.name} is performing below class average in: ${lowSubListStr}. ${recommendation} Suggest pairing with a peer mentor for study groups.`;

        belowAverageStudents.push({
          studentId: student.id,
          name: student.user.name,
          admissionNo: student.admissionNo,
          className: `${student.class?.name || ''}-${student.class?.section || ''}`,
          attendancePercentage,
          lowSubjects,
          aiInsights
        });
      }
    });

    return res.status(200).json({
      classAverage,
      belowAverageStudents
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to perform AI performance analysis', error: String(error) });
  }
};
