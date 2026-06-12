import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import path from 'path';
import dotenv from 'dotenv';
import { Op } from 'sequelize';

dotenv.config();

// Imports
import router from './routes';
import { sequelize, Student, FeeStructure, FeePayment } from './models';
import { initSocket } from './services/socket.service';
import { createNotification } from './services/notification.service';
import { globalRateLimiter } from './middleware/rateLimiter.middleware';

const app = express();
app.set('trust proxy', true);
const server = createServer(app);

// Initialize Socket.io
initSocket(server);

// --- MIDDLEWARES ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // For serving local images
}));

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Rate Limiter
app.use(globalRateLimiter);

// Serve local uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Register Router
app.use(router);

// --- AUTOMATED CRON TASKS ---

// Fee Reminder Cron: Runs every day at 08:00 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily fee reminder cron job...');
  try {
    const today = new Date();
    // Find structures that are overdue
    const structures = await FeeStructure.findAll({
      where: {
        dueDate: { [Op.lt]: today } // standard comparison
      }
    });

    for (const str of structures) {
      // Find students in this class
      const students = await Student.findAll({ where: { tenantId: str.tenantId, classId: str.classId } });
      
      for (const student of students) {
        // Calculate paid amount
        const payments = await FeePayment.findAll({
          where: { tenantId: str.tenantId, studentId: student.id, feeStructureId: str.id }
        });
        const paid = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);

        if (paid < Number(str.amount)) {
          const balance = Number(str.amount) - paid;
          // Send notification
          await createNotification({
            tenantId: str.tenantId,
            userId: student.userId,
            title: 'Fee Payment Overdue Reminder',
            message: `Your payment of $${balance.toFixed(2)} for ${str.feeType} was due on ${str.dueDate}. Please clear it as soon as possible.`,
            type: 'fee'
          });
        }
      }
    }
    console.log('Fee reminder cron job finished.');
  } catch (err) {
    console.error('Failed to run fee reminder cron job:', err);
  }
});

// --- SERVER STARTUP ---
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync DB tables
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully.');

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start server:', error);
    process.exit(1);
  }
};

startServer();
