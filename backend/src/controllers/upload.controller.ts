import { Request, Response } from 'express';
import multer from 'multer';
import { uploadToS3, generatePresignedDownloadUrl } from '../services/s3.service';
import { Tenant } from '../models';

// Configure Multer
const storage = multer.memoryStorage();
export const multerUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const extension = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
    
    if (allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
  }
});

export const uploadProfilePhoto = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Resolve tenant slug for folder prefix
    let tenantPrefix = 'global';
    if (tenantId) {
      const tenant = await Tenant.findByPk(tenantId);
      if (tenant) {
        tenantPrefix = tenant.slug;
      }
    }

    const fileUrl = await uploadToS3(file, tenantPrefix, 'profiles');
    return res.status(200).json({ fileUrl });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upload profile photo', error: String(error) });
  }
};

export const uploadAssignmentFile = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let tenantPrefix = 'global';
    if (tenantId) {
      const tenant = await Tenant.findByPk(tenantId);
      if (tenant) {
        tenantPrefix = tenant.slug;
      }
    }

    const fileUrl = await uploadToS3(file, tenantPrefix, 'assignments');
    return res.status(200).json({ fileUrl });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upload assignment file', error: String(error) });
  }
};

export const getSignedUrl = async (req: Request, res: Response) => {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({ message: 'Key query parameter is required' });
    }

    const signedUrl = await generatePresignedDownloadUrl(key as string);
    return res.status(200).json({ signedUrl });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate presigned URL', error: String(error) });
  }
};
