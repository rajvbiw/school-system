import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { sequelize, Tenant, User, Class, Subject, Student, Attendance, AttendanceSummary, Exam, ExamSubject, Result, Timetable, FeeStructure, FeePayment } from '../models';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await sequelize.authenticate();
    
    // Sync to make sure tables are ready
    await sequelize.sync({ force: true });
    console.log('Database schema reset and synced.');

    // 1. Create Pre-hashed password to avoid slowness
    const passwordHash = await bcrypt.hash('password123', 10);

    // 2. Define Tenant Details
    const tenantsData = [
      { slug: 'school-a', name: 'Springfield Academy', plan: 'pro' as const, primaryColor: '#3B82F6', logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=100' },
      { slug: 'school-b', name: 'Greenwood Institute', plan: 'enterprise' as const, primaryColor: '#10B981', logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=100' }
    ];

    for (const tenantInfo of tenantsData) {
      console.log(`Seeding tenant: ${tenantInfo.name}...`);
      const tenant = await Tenant.create(tenantInfo);
      const tenantId = tenant.id;

      // --- ADMIN ---
      const admin = await User.create({
        tenantId,
        name: `${tenantInfo.name} Admin`,
        email: `admin@${tenantInfo.slug}.com`,
        passwordHash,
        role: 'admin',
        phone: '1234567890',
        isActive: true,
      });

      // --- CLASSES ---
      const classes = [];
      const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 8'];
      const sections = ['A', 'B', 'A', 'B', 'C'];
      for (let i = 0; i < 5; i++) {
        classes.push(await Class.create({
          tenantId,
          name: `${grades[i]}`,
          section: sections[i],
          grade: grades[i],
          roomNo: `Room ${101 + i}`,
          academicYear: '2026-2027'
        }));
      }

      // --- TEACHERS (10 teachers) ---
      const teachers = [];
      const teacherNames = [
        'Walter White', 'Minerva McGonagall', 'Severus Snape', 'Albus Dumbledore', 
        'Charles Xavier', 'John Keating', 'Edna Krabappel', 'Dewey Finn',
        'Mark Thackeray', 'Richard Dadier'
      ];
      for (let i = 0; i < 10; i++) {
        teachers.push(await User.create({
          tenantId,
          name: teacherNames[i],
          email: `teacher${i + 1}@${tenantInfo.slug}.com`,
          passwordHash,
          role: 'teacher',
          phone: `999999900${i}`,
          isActive: true
        }));
      }

      // Assign class teachers to the classes (first 5 teachers)
      for (let i = 0; i < 5; i++) {
        await classes[i].update({ classTeacherId: teachers[i].id });
      }

      // --- SUBJECTS (6 subjects) ---
      const subjects = [];
      const subjectNames = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science'];
      const subjectCodes = ['MATH101', 'SCI101', 'ENG101', 'HIS101', 'GEO101', 'COMP101'];
      
      // Seed subjects across classes
      for (let c = 0; c < 5; c++) {
        for (let s = 0; s < 6; s++) {
          subjects.push(await Subject.create({
            tenantId,
            name: subjectNames[s],
            code: `${subjectCodes[s]}-${classes[c].grade.replace(' ', '')}`,
            classId: classes[c].id,
            teacherId: teachers[(c + s) % 10].id
          }));
        }
      }

      // --- TIMETABLE ---
      // 5 classes, 6 subjects, 6 days (Mon-Sat), 4 slots per day
      for (const cls of classes) {
        const classSubjects = subjects.filter(s => s.classId === cls.id);
        for (let day = 1; day <= 6; day++) {
          const hours = ['09:00', '10:00', '11:00', '12:00'];
          const endHours = ['09:45', '10:45', '11:45', '12:45'];
          for (let slot = 0; slot < 4; slot++) {
            await Timetable.create({
              tenantId,
              classId: cls.id,
              subjectId: classSubjects[slot % classSubjects.length].id,
              dayOfWeek: day,
              startTime: hours[slot],
              endTime: endHours[slot]
            });
          }
        }
      }

      // --- PARENTS (3 parents) ---
      const parents = [];
      for (let i = 0; i < 3; i++) {
        parents.push(await User.create({
          tenantId,
          name: `Parent ${i + 1}`,
          email: `parent${i + 1}@${tenantInfo.slug}.com`,
          passwordHash,
          role: 'parent',
          phone: `888888800${i}`,
          isActive: true
        }));
      }

      // --- STUDENTS (50 students) ---
      const students = [];
      for (let i = 0; i < 50; i++) {
        const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Quinn', 'Avery', 'Sam', 'Jamie'];
        const lastNames = ['Smith', 'Johnson', 'Brown', 'Lee', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Clark', 'Lewis'];
        const randomStudentName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        const studentUser = await User.create({
          tenantId,
          name: randomStudentName,
          email: `student${i + 1}@${tenantInfo.slug}.com`,
          passwordHash,
          role: 'student',
          phone: `777777700${i}`,
          isActive: true
        });

        const studentClass = classes[i % 5];
        const studentParent = parents[i % 3];

        students.push(await Student.create({
          tenantId,
          userId: studentUser.id,
          admissionNo: `${tenantInfo.slug.toUpperCase()}-2026-${1000 + i}`,
          classId: studentClass.id,
          parentId: studentParent.id,
          dob: new Date('2010-05-15'),
          gender: i % 2 === 0 ? 'male' : 'female',
          bloodGroup: 'O+',
          address: '123 Academic Lane, School Town',
          admissionDate: new Date('2026-04-01')
        }));
      }

      // --- FEE STRUCTURE & PAYMENTS ---
      const structures = [];
      const feeTypes = ['Tuition Fee', 'Exam Fee', 'Lab Fee'];
      const feeAmounts = [1500, 200, 150];
      const dueDates = ['2026-06-30', '2026-09-30', '2026-12-31'];

      for (const cls of classes) {
        for (let i = 0; i < 3; i++) {
          structures.push(await FeeStructure.create({
            tenantId,
            classId: cls.id,
            feeType: feeTypes[i],
            amount: feeAmounts[i],
            dueDate: new Date(dueDates[i]),
            academicYear: '2026-2027'
          }));
        }
      }

      // Record payments for 35 of the students (some paid, some partial, some overdue)
      for (let i = 0; i < 35; i++) {
        const student = students[i];
        const studentStructures = structures.filter(s => s.classId === student.classId);
        
        // Structure 1: Paid in full
        await FeePayment.create({
          tenantId,
          studentId: student.id,
          feeStructureId: studentStructures[0].id,
          amountPaid: studentStructures[0].amount,
          method: 'online',
          transactionId: `TXN-${Date.now()}-${i}`,
          status: 'paid',
          receiptNo: `REC-${Date.now()}-${i}-1`,
          paymentDate: new Date('2026-06-15')
        });

        // Structure 2: Partial payment
        await FeePayment.create({
          tenantId,
          studentId: student.id,
          feeStructureId: studentStructures[1].id,
          amountPaid: 100, // half of 200
          method: 'cash',
          status: 'partial',
          receiptNo: `REC-${Date.now()}-${i}-2`,
          paymentDate: new Date('2026-06-16')
        });
      }

      // --- EXAMS & RESULTS ---
      const examNames = ['Mid Term Examination', 'Final Examination'];
      const examTypes = ['mid' as const, 'final' as const];
      const examDates = [new Date('2026-07-10'), new Date('2026-11-20')];

      for (let e = 0; e < 2; e++) {
        for (const cls of classes) {
          const exam = await Exam.create({
            tenantId,
            name: `${examNames[e]} - ${cls.name}`,
            classId: cls.id,
            startDate: examDates[e],
            endDate: new Date(examDates[e].getTime() + 5 * 24 * 60 * 60 * 1000),
            type: examTypes[e]
          });

          const classSubjects = subjects.filter(s => s.classId === cls.id);
          for (const sub of classSubjects) {
            await ExamSubject.create({
              examId: exam.id,
              subjectId: sub.id,
              examDate: exam.startDate,
              maxMarks: 100,
              passMarks: 40,
              durationMins: 120
            });

            // Results for students in this class
            const classStudents = students.filter(s => s.classId === cls.id);
            for (const student of classStudents) {
              const marks = Math.floor(Math.random() * 50) + 50; // 50 to 100
              let grade = 'F';
              if (marks >= 90) grade = 'A+';
              else if (marks >= 80) grade = 'A';
              else if (marks >= 70) grade = 'B';
              else if (marks >= 60) grade = 'C';
              else if (marks >= 50) grade = 'D';
              else if (marks >= 40) grade = 'E';

              await Result.create({
                tenantId,
                studentId: student.id,
                examId: exam.id,
                subjectId: sub.id,
                marksObtained: marks,
                grade,
                remarks: marks >= 40 ? 'Passed' : 'Failed'
              });
            }
          }
        }
      }

      // --- ATTENDANCE DATA (3 months history) ---
      // Generate daily class-level attendance for last 90 days
      console.log(`Generating 3 months of attendance history for ${tenantInfo.name} (this will take a moment)...`);
      const attendanceRecords = [];
      const today = new Date();

      for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
        const date = new Date();
        date.setDate(today.getDate() - dayOffset);
        
        // Skip Sundays
        if (date.getDay() === 0) continue;

        const dateStr = date.toISOString().split('T')[0];

        for (const student of students) {
          // 85% chance of being present, 10% late, 5% absent
          const rand = Math.random();
          let status: 'present' | 'absent' | 'late' = 'present';
          if (rand > 0.95) status = 'absent';
          else if (rand > 0.85) status = 'late';

          attendanceRecords.push({
            tenantId,
            studentId: student.id,
            date: new Date(dateStr),
            status,
            markedBy: admin.id
          });
        }
      }

      // Bulk insert attendance for efficiency
      await Attendance.bulkCreate(attendanceRecords);

      // Recalculate summaries for each student
      console.log(`Computing monthly attendance summaries for ${tenantInfo.name}...`);
      const months = [4, 5, 6]; // April, May, June 2026
      const year = 2026;

      for (const student of students) {
        for (const month of months) {
          const monthStr = String(month).padStart(2, '0');
          const startDate = `${year}-${monthStr}-01`;
          const endDate = `${year}-${monthStr}-31`;

          const totalDays = await Attendance.count({
            where: {
              tenantId,
              studentId: student.id,
              date: { [Op.between]: [startDate, endDate] }
            }
          });

          const presentDays = await Attendance.count({
            where: {
              tenantId,
              studentId: student.id,
              date: { [Op.between]: [startDate, endDate] },
              status: { [Op.in]: ['present', 'late'] }
            }
          });

          const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

          await AttendanceSummary.create({
            tenantId,
            studentId: student.id,
            month,
            year,
            totalDays,
            presentDays,
            percentage
          });
        }
      }
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
