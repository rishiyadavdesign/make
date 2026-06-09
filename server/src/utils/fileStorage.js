import dotenv from 'dotenv';

dotenv.config();

function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET);
}

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', process.env.CLOUDINARY_FOLDER || 'bps-event-portal');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${await response.text()}`);
  }

  const data = await response.json();
  return {
    filename: file.originalname,
    path: data.secure_url,
    mimetype: file.mimetype,
    size: file.size
  };
}

export async function normalizeFiles(files = []) {
  if (isCloudinaryConfigured()) {
    return Promise.all(files.map(uploadToCloudinary));
  }

  return files.map((file) => ({
    filename: file.originalname,
    path: `uploads/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size
  }));
}

export const uploadStorageMode = isCloudinaryConfigured() ? 'cloudinary' : 'local';
