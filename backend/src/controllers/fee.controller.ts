import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { FeeStructure, FeePayment, Student, Class, User } from '../models';
import { logAudit } from '../utils/audit.utils';

export const getFeeStructure = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { class_id } = req.query;

    const whereClause: any = { tenantId };
    if (class_id) {
      whereClause.classId = parseInt(class_id as string);
    }

    const structures = await FeeStructure.findAll({
      where: whereClause,
      include: [{ model: Class, as: 'class', attributes: ['name', 'section', 'grade'] }]
    });

    return res.status(200).json(structures);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve fee structure', error: String(error) });
  }
};

export const createFeeStructure = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { classId, feeType, amount, dueDate, academicYear } = req.body;

    if (!classId || !feeType || !amount || !dueDate || !academicYear) {
      return res.status(400).json({ message: 'Missing fee structure fields' });
    }

    const structure = await FeeStructure.create({
      tenantId,
      classId,
      feeType,
      amount,
      dueDate,
      academicYear
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CREATE',
      tableName: 'fee_structures',
      recordId: structure.id,
      ipAddress: req.ip,
    });

    return res.status(201).json(structure);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create fee structure', error: String(error) });
  }
};

export const getFeePayments = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { status, class_id } = req.query;

    const whereClause: any = { tenantId };
    if (status) {
      whereClause.status = status;
    }

    const studentInclude: any = {
      model: Student,
      as: 'student',
      include: [{ model: User, as: 'user', attributes: ['name'] }]
    };

    if (class_id) {
      studentInclude.where = { classId: parseInt(class_id as string) };
    }

    const payments = await FeePayment.findAll({
      where: whereClause,
      include: [
        studentInclude,
        { model: FeeStructure, as: 'feeStructure', attributes: ['feeType', 'amount'] }
      ],
      order: [['paymentDate', 'DESC']]
    });

    return res.status(200).json(payments);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve payments', error: String(error) });
  }
};

export const recordFeePayment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { studentId, feeStructureId, amountPaid, method, transactionId } = req.body;

    if (!studentId || !feeStructureId || !amountPaid || !method) {
      return res.status(400).json({ message: 'studentId, feeStructureId, amountPaid, and method are required' });
    }

    // Load structure to check overall fee amount
    const structure = await FeeStructure.findByPk(feeStructureId);
    if (!structure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    // Compute previous payments for this structure
    const previousPayments = await FeePayment.findAll({
      where: { tenantId, studentId, feeStructureId }
    });
    const totalPreviouslyPaid = previousPayments.reduce((sum, pay) => sum + Number(pay.amountPaid), 0);

    const totalPaidNow = totalPreviouslyPaid + Number(amountPaid);
    const overallDue = Number(structure.amount);

    let status: 'paid' | 'partial' | 'overdue' = 'partial';
    if (totalPaidNow >= overallDue) {
      status = 'paid';
    } else if (new Date(structure.dueDate) < new Date() && totalPaidNow < overallDue) {
      status = 'overdue';
    }

    const receiptNo = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payment = await FeePayment.create({
      tenantId,
      studentId,
      feeStructureId,
      amountPaid,
      method,
      transactionId,
      status,
      receiptNo,
      paymentDate: new Date()
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CREATE',
      tableName: 'fee_payments',
      recordId: payment.id,
      ipAddress: req.ip,
    });

    return res.status(201).json(payment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to record fee payment', error: String(error) });
  }
};

export const getStudentFees = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params; // Student ID

    const student = await Student.findOne({ where: { id, tenantId } });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const structures = await FeeStructure.findAll({
      where: { tenantId, classId: student.classId }
    });

    const payments = await FeePayment.findAll({
      where: { tenantId, studentId: id }
    });

    // Merge structures with payments to display detailed status
    const feeStatusList = structures.map(str => {
      const relatedPayments = payments.filter(p => p.feeStructureId === str.id);
      const paid = relatedPayments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
      const remaining = Math.max(0, Number(str.amount) - paid);
      
      let status = 'unpaid';
      if (paid >= Number(str.amount)) {
        status = 'paid';
      } else if (paid > 0) {
        status = 'partial';
      } else if (new Date(str.dueDate) < new Date()) {
        status = 'overdue';
      }

      return {
        structureId: str.id,
        feeType: str.feeType,
        totalAmount: Number(str.amount),
        paidAmount: paid,
        remainingAmount: remaining,
        dueDate: str.dueDate,
        status,
        payments: relatedPayments.map(p => ({
          paymentId: p.id,
          amountPaid: Number(p.amountPaid),
          paymentDate: p.paymentDate,
          method: p.method,
          receiptNo: p.receiptNo,
          transactionId: p.transactionId
        }))
      };
    });

    return res.status(200).json(feeStatusList);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to query student invoices', error: String(error) });
  }
};

export const getDefaulters = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    // Load all students
    const students = await Student.findAll({
      where: { tenantId },
      include: [
        { model: User, as: 'user', attributes: ['name', 'email', 'phone'] },
        { model: Class, as: 'class', attributes: ['name', 'section'] }
      ]
    });

    const structures = await FeeStructure.findAll({ where: { tenantId } });
    const payments = await FeePayment.findAll({ where: { tenantId } });

    const defaulters = [];

    for (const student of students) {
      const studentClassId = student.classId;
      const studentStructures = structures.filter(s => s.classId === studentClassId);
      
      let totalDue = 0;
      let totalPaid = 0;
      let isOverdue = false;

      const studentPayments = payments.filter(p => p.studentId === student.id);
      
      for (const str of studentStructures) {
        totalDue += Number(str.amount);
        const paidForStr = studentPayments
          .filter(p => p.feeStructureId === str.id)
          .reduce((sum, p) => sum + Number(p.amountPaid), 0);
        
        totalPaid += paidForStr;

        if (paidForStr < Number(str.amount) && new Date(str.dueDate) < new Date()) {
          isOverdue = true;
        }
      }

      const balance = totalDue - totalPaid;

      if (balance > 0 && isOverdue) {
        defaulters.push({
          studentId: student.id,
          name: student.user.name,
          admissionNo: student.admissionNo,
          class: `${student.class.name}-${student.class.section}`,
          email: student.user.email,
          phone: student.user.phone,
          totalDue,
          totalPaid,
          balance,
        });
      }
    }

    return res.status(200).json(defaulters);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compile defaulters list', error: String(error) });
  }
};
