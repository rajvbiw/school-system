import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '3306');
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'school_erp_main';

export const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  },
});

// --- MODELS DEFINITIONS ---

// 1. Tenant
export interface TenantAttributes {
  id: number;
  slug: string;
  name: string;
  domain?: string;
  plan: 'basic' | 'pro' | 'enterprise';
  logoUrl?: string;
  primaryColor: string;
}
export type TenantCreationAttributes = Optional<TenantAttributes, 'id' | 'domain' | 'logoUrl' | 'primaryColor'>;
export class Tenant extends Model<TenantAttributes, TenantCreationAttributes> implements TenantAttributes {
  public id!: number;
  public slug!: string;
  public name!: string;
  public domain?: string;
  public plan!: 'basic' | 'pro' | 'enterprise';
  public logoUrl?: string;
  public primaryColor!: string;
}
Tenant.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  slug: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  domain: { type: DataTypes.STRING, unique: true },
  plan: { type: DataTypes.ENUM('basic', 'pro', 'enterprise'), defaultValue: 'basic', allowNull: false },
  logoUrl: { type: DataTypes.STRING },
  primaryColor: { type: DataTypes.STRING, defaultValue: '#3B82F6', allowNull: false },
}, { sequelize, modelName: 'Tenant' });

// 2. User
export interface UserAttributes {
  id: number;
  tenantId: number;
  name: string;
  email: string;
  passwordHash: string;
  role: 'superadmin' | 'admin' | 'teacher' | 'student' | 'parent';
  phone?: string;
  profilePhoto?: string;
  isActive: boolean;
}
export type UserCreationAttributes = Optional<UserAttributes, 'id' | 'phone' | 'profilePhoto' | 'isActive'>;
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public tenantId!: number;
  public name!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: 'superadmin' | 'admin' | 'teacher' | 'student' | 'parent';
  public phone?: string;
  public profilePhoto?: string;
  public isActive!: boolean;
}
User.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('superadmin', 'admin', 'teacher', 'student', 'parent'), allowNull: false },
  phone: { type: DataTypes.STRING },
  profilePhoto: { type: DataTypes.STRING },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
}, { sequelize, modelName: 'User' });

// 3. Class
export interface ClassAttributes {
  id: number;
  tenantId: number;
  name: string;
  section: string;
  grade: string;
  roomNo?: string;
  classTeacherId?: number;
  academicYear: string;
}
export class Class extends Model<ClassAttributes, Optional<ClassAttributes, 'id' | 'roomNo' | 'classTeacherId'>> implements ClassAttributes {
  public id!: number;
  public tenantId!: number;
  public name!: string;
  public section!: string;
  public grade!: string;
  public roomNo?: string;
  public classTeacherId?: number;
  public academicYear!: string;
}
Class.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  section: { type: DataTypes.STRING, allowNull: false },
  grade: { type: DataTypes.STRING, allowNull: false },
  roomNo: { type: DataTypes.STRING },
  classTeacherId: { type: DataTypes.INTEGER },
  academicYear: { type: DataTypes.STRING, allowNull: false },
}, { sequelize, modelName: 'Class', tableName: 'classes' });

// 4. Subject
export interface SubjectAttributes {
  id: number;
  tenantId: number;
  name: string;
  code: string;
  classId: number;
  teacherId: number;
}
export class Subject extends Model<SubjectAttributes, Optional<SubjectAttributes, 'id'>> implements SubjectAttributes {
  public id!: number;
  public tenantId!: number;
  public name!: string;
  public code!: string;
  public classId!: number;
  public teacherId!: number;
}
Subject.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false },
  classId: { type: DataTypes.INTEGER, allowNull: false },
  teacherId: { type: DataTypes.INTEGER, allowNull: false },
}, { sequelize, modelName: 'Subject' });

// 5. Student
export interface StudentAttributes {
  id: number;
  tenantId: number;
  userId: number;
  admissionNo: string;
  classId: number;
  parentId?: number;
  dob?: Date;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  admissionDate?: Date;
}
export class Student extends Model<StudentAttributes, Optional<StudentAttributes, 'id' | 'parentId' | 'dob' | 'gender' | 'bloodGroup' | 'address' | 'admissionDate'>> implements StudentAttributes {
  public id!: number;
  public tenantId!: number;
  public userId!: number;
  public admissionNo!: string;
  public classId!: number;
  public parentId?: number;
  public dob?: Date;
  public gender?: string;
  public bloodGroup?: string;
  public address?: string;
  public admissionDate?: Date;

  // Associations
  public user?: User;
  public class?: Class;
  public parent?: User;
}
Student.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  admissionNo: { type: DataTypes.STRING, unique: true, allowNull: false },
  classId: { type: DataTypes.INTEGER, allowNull: false },
  parentId: { type: DataTypes.INTEGER },
  dob: { type: DataTypes.DATEONLY },
  gender: { type: DataTypes.STRING },
  bloodGroup: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  admissionDate: { type: DataTypes.DATEONLY },
}, { sequelize, modelName: 'Student' });

// 6. Attendance
export interface AttendanceAttributes {
  id: number;
  tenantId: number;
  studentId: number;
  subjectId?: number;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'holiday';
  markedBy: number;
}
export class Attendance extends Model<AttendanceAttributes, Optional<AttendanceAttributes, 'id' | 'subjectId'>> implements AttendanceAttributes {
  public id!: number;
  public tenantId!: number;
  public studentId!: number;
  public subjectId?: number;
  public date!: Date;
  public status!: 'present' | 'absent' | 'late' | 'holiday';
  public markedBy!: number;
}
Attendance.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  subjectId: { type: DataTypes.INTEGER },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM('present', 'absent', 'late', 'holiday'), allowNull: false },
  markedBy: { type: DataTypes.INTEGER, allowNull: false },
}, { sequelize, modelName: 'Attendance', tableName: 'attendance' });

// 7. Attendance Summary
export interface AttendanceSummaryAttributes {
  id: number;
  tenantId: number;
  studentId: number;
  month: number;
  year: number;
  totalDays: number;
  presentDays: number;
  percentage: number;
}
export class AttendanceSummary extends Model<AttendanceSummaryAttributes, Optional<AttendanceSummaryAttributes, 'id'>> implements AttendanceSummaryAttributes {
  public id!: number;
  public tenantId!: number;
  public studentId!: number;
  public month!: number;
  public year!: number;
  public totalDays!: number;
  public presentDays!: number;
  public percentage!: number;
}
AttendanceSummary.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  month: { type: DataTypes.INTEGER, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  totalDays: { type: DataTypes.INTEGER, allowNull: false },
  presentDays: { type: DataTypes.INTEGER, allowNull: false },
  percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
}, { sequelize, modelName: 'AttendanceSummary', tableName: 'attendance_summary' });

// 8. Exam
export interface ExamAttributes {
  id: number;
  tenantId: number;
  name: string;
  classId: number;
  startDate: Date;
  endDate: Date;
  type: 'unit' | 'mid' | 'final' | 'mock';
}
export class Exam extends Model<ExamAttributes, Optional<ExamAttributes, 'id'>> implements ExamAttributes {
  public id!: number;
  public tenantId!: number;
  public name!: string;
  public classId!: number;
  public startDate!: Date;
  public endDate!: Date;
  public type!: 'unit' | 'mid' | 'final' | 'mock';
}
Exam.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  classId: { type: DataTypes.INTEGER, allowNull: false },
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: false },
  type: { type: DataTypes.ENUM('unit', 'mid', 'final', 'mock'), allowNull: false },
}, { sequelize, modelName: 'Exam' });

// 9. Exam Subject
export interface ExamSubjectAttributes {
  id: number;
  examId: number;
  subjectId: number;
  examDate: Date;
  maxMarks: number;
  passMarks: number;
  durationMins: number;
}
export class ExamSubject extends Model<ExamSubjectAttributes, Optional<ExamSubjectAttributes, 'id'>> implements ExamSubjectAttributes {
  public id!: number;
  public examId!: number;
  public subjectId!: number;
  public examDate!: Date;
  public maxMarks!: number;
  public passMarks!: number;
  public durationMins!: number;
}
ExamSubject.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  examId: { type: DataTypes.INTEGER, allowNull: false },
  subjectId: { type: DataTypes.INTEGER, allowNull: false },
  examDate: { type: DataTypes.DATEONLY, allowNull: false },
  maxMarks: { type: DataTypes.INTEGER, allowNull: false },
  passMarks: { type: DataTypes.INTEGER, allowNull: false },
  durationMins: { type: DataTypes.INTEGER, allowNull: false },
}, { sequelize, modelName: 'ExamSubject', tableName: 'exam_subjects' });

// 10. Result
export interface ResultAttributes {
  id: number;
  tenantId: number;
  studentId: number;
  examId: number;
  subjectId: number;
  marksObtained: number;
  grade: string;
  remarks?: string;
}
export class Result extends Model<ResultAttributes, Optional<ResultAttributes, 'id' | 'remarks'>> implements ResultAttributes {
  public id!: number;
  public tenantId!: number;
  public studentId!: number;
  public examId!: number;
  public subjectId!: number;
  public marksObtained!: number;
  public grade!: string;
  public remarks?: string;

  // Associations
  public student?: Student;
  public exam?: Exam;
  public subject?: Subject;
}
Result.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  examId: { type: DataTypes.INTEGER, allowNull: false },
  subjectId: { type: DataTypes.INTEGER, allowNull: false },
  marksObtained: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  grade: { type: DataTypes.STRING, allowNull: false },
  remarks: { type: DataTypes.STRING },
}, { sequelize, modelName: 'Result' });

// 11. Timetable
export interface TimetableAttributes {
  id: number;
  tenantId: number;
  classId: number;
  subjectId: number;
  dayOfWeek: number; // 1 (Mon) - 6 (Sat)
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "09:45"
}
export class Timetable extends Model<TimetableAttributes, Optional<TimetableAttributes, 'id'>> implements TimetableAttributes {
  public id!: number;
  public tenantId!: number;
  public classId!: number;
  public subjectId!: number;
  public dayOfWeek!: number;
  public startTime!: string;
  public endTime!: string;

  // Associations
  public class?: Class;
  public subject?: Subject;
}
Timetable.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  classId: { type: DataTypes.INTEGER, allowNull: false },
  subjectId: { type: DataTypes.INTEGER, allowNull: false },
  dayOfWeek: { type: DataTypes.TINYINT, allowNull: false },
  startTime: { type: DataTypes.TIME, allowNull: false },
  endTime: { type: DataTypes.TIME, allowNull: false },
}, { sequelize, modelName: 'Timetable', tableName: 'timetable' });

// 12. Assignment
export interface AssignmentAttributes {
  id: number;
  tenantId: number;
  subjectId: number;
  title: string;
  description?: string;
  dueDate: Date;
  fileUrl?: string;
  createdBy: number;
}
export class Assignment extends Model<AssignmentAttributes, Optional<AssignmentAttributes, 'id' | 'description' | 'fileUrl'>> implements AssignmentAttributes {
  public id!: number;
  public tenantId!: number;
  public subjectId!: number;
  public title!: string;
  public description?: string;
  public dueDate!: Date;
  public fileUrl?: string;
  public createdBy!: number;
}
Assignment.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  subjectId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  fileUrl: { type: DataTypes.STRING },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
}, { sequelize, modelName: 'Assignment' });

// 13. Submission
export interface SubmissionAttributes {
  id: number;
  assignmentId: number;
  studentId: number;
  submittedAt: Date;
  fileUrl: string;
  marks?: number;
  feedback?: string;
}
export class Submission extends Model<SubmissionAttributes, Optional<SubmissionAttributes, 'id' | 'marks' | 'feedback'>> implements SubmissionAttributes {
  public id!: number;
  public assignmentId!: number;
  public studentId!: number;
  public submittedAt!: Date;
  public fileUrl!: string;
  public marks?: number;
  public feedback?: string;
}
Submission.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  assignmentId: { type: DataTypes.INTEGER, allowNull: false },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
  fileUrl: { type: DataTypes.STRING, allowNull: false },
  marks: { type: DataTypes.DECIMAL(5, 2) },
  feedback: { type: DataTypes.TEXT },
}, { sequelize, modelName: 'Submission' });

// 14. Fee Structure
export interface FeeStructureAttributes {
  id: number;
  tenantId: number;
  classId: number;
  feeType: string;
  amount: number;
  dueDate: Date;
  academicYear: string;
}
export class FeeStructure extends Model<FeeStructureAttributes, Optional<FeeStructureAttributes, 'id'>> implements FeeStructureAttributes {
  public id!: number;
  public tenantId!: number;
  public classId!: number;
  public feeType!: string;
  public amount!: number;
  public dueDate!: Date;
  public academicYear!: string;
}
FeeStructure.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  classId: { type: DataTypes.INTEGER, allowNull: false },
  feeType: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  dueDate: { type: DataTypes.DATEONLY, allowNull: false },
  academicYear: { type: DataTypes.STRING, allowNull: false },
}, { sequelize, modelName: 'FeeStructure', tableName: 'fee_structures' });

// 15. Fee Payment
export interface FeePaymentAttributes {
  id: number;
  tenantId: number;
  studentId: number;
  feeStructureId: number;
  amountPaid: number;
  paymentDate: Date;
  method: 'cash' | 'online' | 'cheque';
  transactionId?: string;
  status: 'paid' | 'partial' | 'overdue';
  receiptNo: string;
}
export class FeePayment extends Model<FeePaymentAttributes, Optional<FeePaymentAttributes, 'id' | 'transactionId'>> implements FeePaymentAttributes {
  public id!: number;
  public tenantId!: number;
  public studentId!: number;
  public feeStructureId!: number;
  public amountPaid!: number;
  public paymentDate!: Date;
  public method!: 'cash' | 'online' | 'cheque';
  public transactionId?: string;
  public status!: 'paid' | 'partial' | 'overdue';
  public receiptNo!: string;

  // Associations
  public student?: Student;
  public feeStructure?: FeeStructure;
}
FeePayment.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  feeStructureId: { type: DataTypes.INTEGER, allowNull: false },
  amountPaid: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  paymentDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
  method: { type: DataTypes.ENUM('cash', 'online', 'cheque'), allowNull: false },
  transactionId: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('paid', 'partial', 'overdue'), allowNull: false },
  receiptNo: { type: DataTypes.STRING, allowNull: false },
}, { sequelize, modelName: 'FeePayment', tableName: 'fee_payments' });

// 16. Announcement
export interface AnnouncementAttributes {
  id: number;
  tenantId: number;
  title: string;
  content: string;
  targetRole: string; // e.g. "all", "teacher", "student", "parent"
  classId?: number;
  createdBy: number;
}
export class Announcement extends Model<AnnouncementAttributes, Optional<AnnouncementAttributes, 'id' | 'classId'>> implements AnnouncementAttributes {
  public id!: number;
  public tenantId!: number;
  public title!: string;
  public content!: string;
  public targetRole!: string;
  public classId?: number;
  public createdBy!: number;
}
Announcement.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  targetRole: { type: DataTypes.STRING, allowNull: false },
  classId: { type: DataTypes.INTEGER },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
}, { sequelize, modelName: 'Announcement' });

// 17. Notification
export interface NotificationAttributes {
  id: number;
  tenantId: number;
  userId: number;
  title: string;
  message: string;
  type: string; // e.g., 'attendance', 'fee', 'announcement', 'message'
  isRead: boolean;
}
export class Notification extends Model<NotificationAttributes, Optional<NotificationAttributes, 'id' | 'isRead'>> implements NotificationAttributes {
  public id!: number;
  public tenantId!: number;
  public userId!: number;
  public title!: string;
  public message!: string;
  public type!: string;
  public isRead!: boolean;

  // Timestamps
  public createdAt!: Date;
  public updatedAt!: Date;
}
Notification.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
}, { sequelize, modelName: 'Notification' });

// 18. Message
export interface MessageAttributes {
  id: number;
  tenantId: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
}
export class Message extends Model<MessageAttributes, Optional<MessageAttributes, 'id' | 'isRead'>> implements MessageAttributes {
  public id!: number;
  public tenantId!: number;
  public senderId!: number;
  public receiverId!: number;
  public content!: string;
  public isRead!: boolean;
}
Message.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  receiverId: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
}, { sequelize, modelName: 'Message' });

// 19. Audit Log
export interface AuditLogAttributes {
  id: number;
  userId?: number;
  action: string;
  tableName: string;
  recordId?: number;
  ipAddress?: string;
}
export class AuditLog extends Model<AuditLogAttributes, Optional<AuditLogAttributes, 'id' | 'userId' | 'recordId' | 'ipAddress'>> implements AuditLogAttributes {
  public id!: number;
  public userId?: number;
  public action!: string;
  public tableName!: string;
  public recordId?: number;
  public ipAddress?: string;
}
AuditLog.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER },
  action: { type: DataTypes.STRING, allowNull: false },
  tableName: { type: DataTypes.STRING, allowNull: false },
  recordId: { type: DataTypes.INTEGER },
  ipAddress: { type: DataTypes.STRING },
}, { sequelize, modelName: 'AuditLog', tableName: 'audit_log' });


// --- MODEL ASSOCIATIONS ---

// Tenant & User
Tenant.hasMany(User, { foreignKey: 'tenantId', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// Tenant & Class
Tenant.hasMany(Class, { foreignKey: 'tenantId', as: 'classes' });
Class.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// User & Class (Teacher)
User.hasMany(Class, { foreignKey: 'classTeacherId', as: 'managedClasses' });
Class.belongsTo(User, { foreignKey: 'classTeacherId', as: 'classTeacher' });

// Class & Subject
Class.hasMany(Subject, { foreignKey: 'classId', as: 'subjects' });
Subject.belongsTo(Class, { foreignKey: 'class' });

// User & Subject (Teacher)
User.hasMany(Subject, { foreignKey: 'teacherId', as: 'taughtSubjects' });
Subject.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

// User (Student) & Student Profile
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User (Parent) & Student Profile
User.hasMany(Student, { foreignKey: 'parentId', as: 'children' });
Student.belongsTo(User, { foreignKey: 'parentId', as: 'parent' });

// Class & Student
Class.hasMany(Student, { foreignKey: 'classId', as: 'students' });
Student.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// Student & Attendance
Student.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendances' });
Attendance.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Subject & Attendance
Subject.hasMany(Attendance, { foreignKey: 'subjectId', as: 'attendances' });
Attendance.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

// Student & AttendanceSummary
Student.hasMany(AttendanceSummary, { foreignKey: 'studentId', as: 'attendanceSummaries' });
AttendanceSummary.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Class & Exam
Class.hasMany(Exam, { foreignKey: 'classId', as: 'exams' });
Exam.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// Exam & ExamSubject
Exam.hasMany(ExamSubject, { foreignKey: 'examId', as: 'examSubjects' });
ExamSubject.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

// Subject & ExamSubject
Subject.hasMany(ExamSubject, { foreignKey: 'subjectId', as: 'examSubjects' });
ExamSubject.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

// Student & Result
Student.hasMany(Result, { foreignKey: 'studentId', as: 'results' });
Result.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Exam & Result
Exam.hasMany(Result, { foreignKey: 'examId', as: 'results' });
Result.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

// Subject & Result
Subject.hasMany(Result, { foreignKey: 'subjectId', as: 'results' });
Result.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

// Class & Timetable
Class.hasMany(Timetable, { foreignKey: 'classId', as: 'timetables' });
Timetable.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// Subject & Timetable
Subject.hasMany(Timetable, { foreignKey: 'subjectId', as: 'timetables' });
Timetable.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

// Subject & Assignment
Subject.hasMany(Assignment, { foreignKey: 'subjectId', as: 'assignments' });
Assignment.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

// User & Assignment (Creator)
User.hasMany(Assignment, { foreignKey: 'createdBy', as: 'createdAssignments' });
Assignment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Assignment & Submission
Assignment.hasMany(Submission, { foreignKey: 'assignmentId', as: 'submissions' });
Submission.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });

// Student & Submission
Student.hasMany(Submission, { foreignKey: 'studentId', as: 'submissions' });
Submission.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Class & FeeStructure
Class.hasMany(FeeStructure, { foreignKey: 'classId', as: 'feeStructures' });
FeeStructure.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// Student & FeePayment
Student.hasMany(FeePayment, { foreignKey: 'studentId', as: 'feePayments' });
FeePayment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// FeeStructure & FeePayment
FeeStructure.hasMany(FeePayment, { foreignKey: 'feeStructureId', as: 'feePayments' });
FeePayment.belongsTo(FeeStructure, { foreignKey: 'feeStructureId', as: 'feeStructure' });

// User (Creator) & Announcement
User.hasMany(Announcement, { foreignKey: 'createdBy', as: 'createdAnnouncements' });
Announcement.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Class & Announcement
Class.hasMany(Announcement, { foreignKey: 'classId', as: 'announcements' });
Announcement.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// User & Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User (Sender) & Message
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// User (Receiver) & Message
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// User & AuditLog
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
