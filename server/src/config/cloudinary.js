const cloudinary = require('cloudinary').v2;

/**
 * Configure Cloudinary with environment variables
 */
const configureCloudinary = () => {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (cloud_name && api_key && api_secret) {
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
      secure: true
    });
    return true;
  }
  return false;
};

// Initial configuration attempt
configureCloudinary();

const isCloudinaryConfigured = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  return Boolean(cloud_name && api_key && api_secret);
};

/**
 * Upload a file buffer into Cloudinary via upload_stream
 * Uses authenticated asset type to ensure private access
 *
 * @param {Buffer} buffer - File buffer
 * @param {Object} options
 * @param {string} options.folder - Destination folder in Cloudinary
 * @param {string} [options.publicId] - Optional explicit asset identifier
 * @param {string} [options.resourceType='auto'] - 'auto' | 'image' | 'raw'
 * @param {string} [options.deliveryType='authenticated'] - 'authenticated' | 'private'
 * @returns {Promise<Object>}
 */
const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(new Error('Cloudinary is not configured. Please verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'));
    }

    const {
      folder = 'lifeledger/attachments',
      publicId,
      resourceType = 'auto',
      deliveryType = 'authenticated'
    } = options;

    const uploadOptions = {
      folder,
      type: deliveryType,
      resource_type: resourceType,
      overwrite: false,
      use_filename: false,
      unique_filename: true
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(new Error(`Cloudinary upload failed: ${error.message}`));
      }
      resolve({
        publicId: result.public_id,
        resourceType: result.resource_type,
        deliveryType: result.type || deliveryType,
        format: result.format || '',
        bytes: result.bytes,
        secureUrl: result.secure_url
      });
    });

    stream.end(buffer);
  });
};

/**
 * Generate a short-lived signed delivery URL for viewing or downloading an authenticated asset
 *
 * @param {string} publicId - Cloudinary public identifier
 * @param {Object} options
 * @param {string} [options.resourceType='auto']
 * @param {string} [options.deliveryType='authenticated']
 * @param {string} [options.format]
 * @param {boolean} [options.isDownload=false]
 * @param {string} [options.originalName]
 * @param {number} [options.expiresInSeconds=300] - 5 minutes default
 * @returns {string} Signed access URL
 */
const generateSignedUrl = (publicId, options = {}) => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured.');
  }

  const {
    resourceType = 'auto',
    deliveryType = 'authenticated',
    format = '',
    isDownload = false,
    originalName = 'document',
    expiresInSeconds = 300
  } = options;

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // Use private_download_url for time-limited, signed access
  const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType === 'auto' ? 'image' : resourceType,
    type: deliveryType,
    expires_at: expiresAt,
    attachment: isDownload
  });

  return signedUrl;
};

/**
 * Destroy/delete an asset from Cloudinary
 *
 * @param {string} publicId - Cloudinary public identifier
 * @param {Object} options
 * @param {string} [options.resourceType='image']
 * @param {string} [options.deliveryType='authenticated']
 * @returns {Promise<Object>}
 */
const destroyAsset = async (publicId, options = {}) => {
  if (!isCloudinaryConfigured()) {
    return { result: 'skipped_not_configured' };
  }

  const {
    resourceType = 'image',
    deliveryType = 'authenticated'
  } = options;

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: deliveryType
    });
    return result;
  } catch (err) {
    console.error(`[Cloudinary] Error destroying asset ${publicId}:`, err.message);
    throw err;
  }
};

module.exports = {
  cloudinary,
  configureCloudinary,
  isCloudinaryConfigured,
  uploadBuffer,
  generateSignedUrl,
  destroyAsset
};
