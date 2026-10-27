const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain'
]);

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.txt'
]);

// 5MB default maximum file size
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_BYTES, 10) || 5 * 1024 * 1024;

// Use in-memory buffer storage for direct Cloudinary streaming without local disk footprints
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error('Invalid file type. Allowed formats: PDF, JPEG, PNG, WEBP, TXT.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter
});

/**
 * Safely delete a legacy local file from disk if present
 */
const deleteFile = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.error(`[Storage] Failed to delete file at ${filePath}:`, err.message);
  }
};

module.exports = {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  upload,
  deleteFile
};

