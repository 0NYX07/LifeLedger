const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');

// Base directory for private uploads
const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '../../uploads');

// Ensure base upload directory exists
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Isolate storage per user to prevent cross-user directory contamination
    const userDir = path.join(UPLOAD_ROOT, req.user.id.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate secure randomized storage filename with sanitized extension
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`;
    cb(null, randomName);
  }
});

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
 * Safely delete a file from disk
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
  UPLOAD_ROOT,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  upload,
  deleteFile
};
