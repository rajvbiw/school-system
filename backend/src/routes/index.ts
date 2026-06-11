import { Router } from 'express';

// Middlewares
import { authenticateJWT } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { authorizeRoles } from '../middleware/rbac.middleware';
import { globalRateLimiter, authRateLimiter } from '../middleware/rateLimiter.middleware';
import { multerUpload } from '../controllers/upload.controller';

// Controllers
import * as authController from '../controllers/auth.controller';
import * as tenantController from '../controllers/tenant.controller';
import * as userController from '../controllers/user.controller';
import * as attendanceController from '../controllers/attendance.controller';
import * as academicController from '../controllers/academic.controller';
import * as feeController from '../controllers/fee.controller';
import * as dashboardController from '../controllers/dashboard.controller';
import * as notificationController from '../controllers/notification.controller';
import * as uploadController from '../controllers/upload.controller';
import * as healthController from '../controllers/health.controller';
import * as messageController from '../controllers/message.controller';


const router = Router();

// --- PUBLIC & HEALTH ROUTES ---
router.get('/health', healthController.livenessCheck);
router.get('/ready', healthController.readinessCheck);

// --- AUTHENTICATION ---
router.post('/api/auth/login', authRateLimiter, resolveTenant, authController.login);
router.post('/api/auth/refresh', authController.refresh);
router.post('/api/auth/logout', authController.logout);
router.get('/api/auth/me', authenticateJWT, authController.getMe);

// --- TENANTS (Superadmin Only) ---
router.get(
  '/api/tenants',
  authenticateJWT,
  authorizeRoles(['superadmin']),
  tenantController.getTenants
);
router.post(
  '/api/tenants',
  authenticateJWT,
  authorizeRoles(['superadmin']),
  tenantController.createTenant
);
router.put(
  '/api/tenants/:id',
  authenticateJWT,
  authorizeRoles(['superadmin']),
  tenantController.updateTenant
);
router.get(
  '/api/tenants/:id/stats',
  authenticateJWT,
  authorizeRoles(['superadmin']),
  tenantController.getTenantStats
);

// --- USERS & STUDENTS ---
router.get(
  '/api/users',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin', 'teacher']),
  userController.getUsers
);
router.post(
  '/api/users',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin']),
  userController.createUser
);
router.post(
  '/api/users/bulk-import',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin']),
  userController.bulkImportUsers
);
router.put(
  '/api/users/:id',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin']),
  userController.updateUser
);

router.get(
  '/api/students',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin', 'teacher']),
  userController.getStudents
);
router.get(
  '/api/students/:id',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin', 'teacher', 'parent']),
  userController.getStudentById
);
router.post(
  '/api/students',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin']),
  userController.createStudent
);

// --- ATTENDANCE ---
router.get(
  '/api/attendance',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin', 'teacher']),
  attendanceController.getAttendance
);
router.post(
  '/api/attendance/bulk',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin', 'teacher']),
  attendanceController.bulkMarkAttendance
);
router.get(
  '/api/attendance/student/:id',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin', 'teacher', 'student', 'parent']),
  attendanceController.getStudentAttendance
);
router.get(
  '/api/attendance/summary',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin', 'teacher']),
  attendanceController.getAttendanceSummary
);

// --- ACADEMICS (Exams, Results, Timetable, Assignments) ---
router.get(
  '/api/exams',
  authenticateJWT,
  resolveTenant,
  academicController.getExams
);
router.post(
  '/api/exams',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin']),
  academicController.createExam
);
router.get(
  '/api/results',
  authenticateJWT,
  resolveTenant,
  academicController.getResults
);
router.post(
  '/api/results/bulk',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin', 'teacher']),
  academicController.bulkUploadResults
);
router.get(
  '/api/results/student/:id',
  authenticateJWT,
  resolveTenant,
  academicController.getStudentResults
);
router.get(
  '/api/results/report-card/:student_id/:exam_id',
  authenticateJWT,
  resolveTenant,
  academicController.getReportCard
);
router.get(
  '/api/academic/ai-performance-analysis',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin', 'teacher']),
  academicController.getAIPerformanceAnalysis
);
router.get(
  '/api/timetable',
  authenticateJWT,
  resolveTenant,
  academicController.getTimetable
);
router.post(
  '/api/assignments',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin', 'teacher']),
  academicController.createAssignment
);
router.get(
  '/api/assignments',
  authenticateJWT,
  resolveTenant,
  academicController.getAssignments
);
router.post(
  '/api/submissions',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['student']),
  academicController.submitAssignment
);

// --- FEES ---
router.get(
  '/api/fees/structure',
  authenticateJWT,
  resolveTenant,
  feeController.getFeeStructure
);
router.post(
  '/api/fees/structure',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin']),
  feeController.createFeeStructure
);
router.get(
  '/api/fees/payments',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin']),
  feeController.getFeePayments
);
router.post(
  '/api/fees/payments',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin', 'parent']), // Parent stripe payments
  feeController.recordFeePayment
);
router.get(
  '/api/fees/student/:id',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin', 'student', 'parent']),
  feeController.getStudentFees
);
router.get(
  '/api/fees/defaulters',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin']),
  feeController.getDefaulters
);

// --- DASHBOARDS ---
router.get(
  '/api/dashboard/admin',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin']),
  dashboardController.getAdminDashboard
);
router.get(
  '/api/dashboard/teacher',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['teacher']),
  dashboardController.getTeacherDashboard
);
router.get(
  '/api/dashboard/student',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['student']),
  dashboardController.getStudentDashboard
);
router.get(
  '/api/dashboard/parent',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['parent']),
  dashboardController.getParentDashboard
);

// --- NOTIFICATIONS & ANNOUNCEMENTS ---
router.get(
  '/api/notifications',
  authenticateJWT,
  resolveTenant,
  notificationController.getNotifications
);
router.put(
  '/api/notifications/:id/read',
  authenticateJWT,
  resolveTenant,
  notificationController.markAsRead
);
router.post(
  '/api/announcements',
  authenticateJWT,
  resolveTenant,
  authorizeRoles(['admin']),
  notificationController.createAnnouncement
);

// --- UPLOADS ---
router.post(
  '/api/upload/profile-photo',
  authenticateJWT,
  resolveTenant,
  multerUpload.single('file'),
  uploadController.uploadProfilePhoto
);
router.post(
  '/api/upload/assignment',
  authenticateJWT,
  resolveTenant,
  multerUpload.single('file'),
  uploadController.uploadAssignmentFile
);
router.get(
  '/api/upload/signed-url',
  authenticateJWT,
  resolveTenant,
  uploadController.getSignedUrl
);

// --- MESSAGING ---
router.get(
  '/api/messages/contacts',
  authenticateJWT,
  resolveTenant,
  messageController.getContacts
);
router.get(
  '/api/messages/:contactId',
  authenticateJWT,
  resolveTenant,
  messageController.getMessages
);
router.post(
  '/api/messages',
  authenticateJWT,
  resolveTenant,
  messageController.sendMessage
);

export default router;

