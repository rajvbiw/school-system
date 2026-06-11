import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.S3_BUCKET_NAME || 'school-erp-uploads';

// Check if credentials are mock/missing
const isMockS3 = !accessKeyId || accessKeyId.startsWith('mock') || !secretAccessKey || secretAccessKey.startsWith('mock');

let s3Client: S3Client | null = null;
if (!isMockS3) {
  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

// Local storage settings
const LOCAL_UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

export const uploadToS3 = async (
  file: Express.Multer.File,
  tenantPrefix: string,
  folder: string
): Promise<string> => {
  const fileExtension = path.extname(file.originalname);
  const key = `${tenantPrefix}/${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExtension}`;

  if (s3Client) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });
      await s3Client.send(command);
      return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('AWS S3 Upload failed. Falling back to local storage.', error);
    }
  }

  // Fallback to local file storage
  const localFileName = key.replace(/\//g, '_'); // Flatten path for flat local directory
  const localFilePath = path.join(LOCAL_UPLOADS_DIR, localFileName);
  await fs.promises.writeFile(localFilePath, file.buffer);
  
  const serverPort = process.env.PORT || '5000';
  return `http://localhost:${serverPort}/uploads/${localFileName}`;
};

export const generatePresignedDownloadUrl = async (fileKey: string): Promise<string> => {
  if (s3Client) {
    try {
      // Extract key if a full S3 URL is provided
      let s3Key = fileKey;
      if (fileKey.startsWith('http')) {
        const urlObj = new URL(fileKey);
        s3Key = urlObj.pathname.substring(1); // Remove leading slash
      }
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      console.error('Error generating pre-signed URL', error);
    }
  }

  // Fallback: If it's a local URL, just return it directly (it's already public)
  return fileKey;
};

export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  if (s3Client && fileUrl.includes('amazonaws.com')) {
    try {
      const urlObj = new URL(fileUrl);
      const key = urlObj.pathname.substring(1);
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await s3Client.send(command);
      return;
    } catch (error) {
      console.error('AWS S3 Delete failed:', error);
    }
  }

  // Fallback: delete local file
  if (fileUrl.includes('/uploads/')) {
    try {
      const fileName = fileUrl.split('/uploads/')[1];
      const localFilePath = path.join(LOCAL_UPLOADS_DIR, fileName);
      if (fs.existsSync(localFilePath)) {
        await fs.promises.unlink(localFilePath);
      }
    } catch (error) {
      console.error('Local delete failed:', error);
    }
  }
};
