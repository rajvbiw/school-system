import { Request, Response } from 'express';
import { Tenant, User, Student, Class } from '../models';
import { logAudit } from '../utils/audit.utils';

export const getTenants = async (req: Request, res: Response) => {
  try {
    const tenants = await Tenant.findAll();
    return res.status(200).json(tenants);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve tenants', error: String(error) });
  }
};

export const createTenant = async (req: Request, res: Response) => {
  try {
    const { name, slug, domain, plan, primaryColor, logoUrl } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: 'Name and slug are required' });
    }

    const existing = await Tenant.findOne({ where: { slug } });
    if (existing) {
      return res.status(400).json({ message: 'Tenant slug must be unique' });
    }

    const tenant = await Tenant.create({
      name,
      slug,
      domain,
      plan: plan || 'basic',
      primaryColor: primaryColor || '#3B82F6',
      logoUrl,
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CREATE',
      tableName: 'tenants',
      recordId: tenant.id,
      ipAddress: req.ip,
    });

    return res.status(201).json(tenant);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create tenant', error: String(error) });
  }
};

export const updateTenant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, domain, plan, primaryColor, logoUrl } = req.body;

    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    await tenant.update({
      name: name || tenant.name,
      domain: domain !== undefined ? domain : tenant.domain,
      plan: plan || tenant.plan,
      primaryColor: primaryColor || tenant.primaryColor,
      logoUrl: logoUrl !== undefined ? logoUrl : tenant.logoUrl,
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'UPDATE',
      tableName: 'tenants',
      recordId: tenant.id,
      ipAddress: req.ip,
    });

    return res.status(200).json(tenant);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update tenant', error: String(error) });
  }
};

export const getTenantStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = parseInt(id);

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const studentCount = await Student.count({ where: { tenantId } });
    const teacherCount = await User.count({ where: { tenantId, role: 'teacher' } });
    const classCount = await Class.count({ where: { tenantId } });

    return res.status(200).json({
      tenantName: tenant.name,
      slug: tenant.slug,
      stats: {
        students: studentCount,
        teachers: teacherCount,
        classes: classCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch tenant stats', error: String(error) });
  }
};
