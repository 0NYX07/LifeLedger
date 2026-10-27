const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const {
  isCloudinaryConfigured,
  uploadBuffer,
  generateSignedUrl,
  destroyAsset
} = require('../config/cloudinary');

/**
 * Determine safe resource type for Cloudinary based on MIME type or extension
 */
const determineResourceType = (mimeType, originalName) => {
  const ext = path.extname(originalName || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext) || (mimeType && mimeType.startsWith('image/'))) {
    return 'image';
  }
  return 'raw';
};

/**
 * Upload a document to Cloudinary
 *
 * @param {Object} params
 * @param {Buffer} params.buffer - Uploaded file buffer
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.originalName - Original display name
 * @param {string} params.mimeType - Validated MIME type
 * @param {number} params.size - File size in bytes
 * @returns {Promise<Object>} Attachment metadata for persistence
 */
const uploadAttachmentFile = async ({ buffer, userId, originalName, mimeType, size }) => {
  if (!buffer || buffer.length === 0) {
    throw new Error('Upload buffer cannot be empty.');
  }

  const ext = path.extname(originalName).toLowerCase();
  const format = ext.replace('.', '');
  const resourceType = determineResourceType(mimeType, originalName);
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const safeFilename = `${Date.now()}-${randomSuffix}${ext}`;
  const publicId = `lifeledger/attachments/${userId}/${Date.now()}-${randomSuffix}`;

  // Section 11: Use mocked provider responses for automated tests
  if (process.env.NODE_ENV === 'test') {
    return {
      filename: safeFilename,
      originalName,
      mimeType,
      size: size || buffer.length,
      publicId,
      resourceType,
      deliveryType: 'authenticated',
      format,
      storageProvider: 'cloudinary',
      uploadedAt: new Date()
    };
  }

  // If Cloudinary is configured, upload to Cloudinary
  if (isCloudinaryConfigured()) {
    const uploadResult = await uploadBuffer(buffer, {
      folder: `lifeledger/attachments/${userId}`,
      publicId: `${Date.now()}-${randomSuffix}`,
      resourceType,
      deliveryType: 'authenticated'
    });

    return {
      filename: safeFilename,
      originalName,
      mimeType,
      size: size || buffer.length,
      publicId: uploadResult.publicId,
      resourceType: uploadResult.resourceType || resourceType,
      deliveryType: uploadResult.deliveryType || 'authenticated',
      format: uploadResult.format || format,
      storageProvider: 'cloudinary',
      uploadedAt: new Date()
    };
  }

  // If in test or non-production environment without Cloudinary configured, provide a safe mocked record
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    return {
      filename: safeFilename,
      originalName,
      mimeType,
      size: size || buffer.length,
      publicId,
      resourceType,
      deliveryType: 'authenticated',
      format,
      storageProvider: 'mock_cloudinary',
      uploadedAt: new Date()
    };
  }

  throw new Error('Cloudinary storage is required in production. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
};

/**
 * Generate a short-lived authorized URL for viewing or downloading
 *
 * @param {Object} attachment - Obligation attachment subdocument
 * @param {Object} options
 * @param {boolean} [options.isDownload=false]
 * @returns {string|null}
 */
const getAttachmentAccessUrl = (attachment, options = {}) => {
  if (!attachment) return null;

  const { isDownload = false } = options;

  if (process.env.NODE_ENV === 'test') {
    return `https://res.cloudinary.com/mock-cloud/${attachment.resourceType || 'image'}/authenticated/${attachment.publicId || 'doc'}?expires_at=${Math.floor(Date.now() / 1000) + 300}&attachment=${isDownload}`;
  }

  if (attachment.publicId && isCloudinaryConfigured()) {
    return generateSignedUrl(attachment.publicId, {
      resourceType: attachment.resourceType || 'auto',
      deliveryType: attachment.deliveryType || 'authenticated',
      format: attachment.format,
      isDownload,
      originalName: attachment.originalName,
      expiresInSeconds: 300 // 5 minutes
    });
  }

  return null;
};

/**
 * Safely delete an attachment asset from Cloudinary or legacy local storage
 *
 * @param {Object} attachment - Obligation attachment subdocument
 * @returns {Promise<void>}
 */
const deleteAttachmentAsset = async (attachment) => {
  if (!attachment) return;

  if (process.env.NODE_ENV === 'test') {
    return { result: 'ok' };
  }

  // Cloudinary asset deletion
  if (attachment.publicId) {
    const res = await destroyAsset(attachment.publicId, {
      resourceType: attachment.resourceType || 'image',
      deliveryType: attachment.deliveryType || 'authenticated'
    });
    if (res && res.result && !['ok', 'not found', 'skipped_not_configured'].includes(res.result)) {
      throw new Error(`Cloudinary asset deletion failed: ${res.result}`);
    }
  }

  // Backward compatibility: legacy local file deletion if present
  if (attachment.storagePath) {
    try {
      if (fs.existsSync(attachment.storagePath)) {
        await fs.promises.unlink(attachment.storagePath);
      }
    } catch (err) {
      console.error(`[StorageService] Legacy local file deletion error for ${attachment.storagePath}:`, err.message);
    }
  }
};

module.exports = {
  determineResourceType,
  uploadAttachmentFile,
  getAttachmentAccessUrl,
  deleteAttachmentAsset
};
