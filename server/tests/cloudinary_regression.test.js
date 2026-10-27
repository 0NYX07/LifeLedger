const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const {
  configureCloudinary,
  isCloudinaryConfigured,
  verifyCloudinaryConfig,
  uploadBuffer,
  cloudinary
} = require('../src/config/cloudinary');

describe('Cloudinary Configuration, Upload SDK & Credential Regression Tests', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    configureCloudinary();
  });

  test('1. Cloudinary configuration reports not configured when required credentials are missing', () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const result = configureCloudinary();
    assert.equal(result, false);
    assert.equal(isCloudinaryConfigured(), false);
  });

  test('2. uploadBuffer rejects cleanly with actionable error when credentials are missing', async () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    configureCloudinary();

    await assert.rejects(
      async () => {
        await uploadBuffer(Buffer.from('test buffer'), { folder: 'test' });
      },
      (err) => {
        assert.ok(err.message.includes('Cloudinary is not configured'));
        return true;
      }
    );
  });

  test('3. uploadBuffer passes canonical folder, publicId, type: authenticated, and options to upload_stream', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'mock_cloud';
    process.env.CLOUDINARY_API_KEY = 'mock_key_1234567890';
    process.env.CLOUDINARY_API_SECRET = 'mock_secret_abcdef1234567890';
    configureCloudinary();

    let capturedOptions = null;
    let streamEnded = false;

    // Spy on cloudinary.uploader.upload_stream
    const originalUploadStream = cloudinary.uploader.upload_stream;
    cloudinary.uploader.upload_stream = (options, callback) => {
      capturedOptions = options;
      return {
        end: (buf) => {
          streamEnded = true;
          // Simulate SDK returning successful response
          callback(null, {
            public_id: `${options.folder}/${options.public_id}`,
            resource_type: options.resource_type,
            type: options.type,
            format: 'pdf',
            bytes: buf.length,
            secure_url: `https://res.cloudinary.com/mock_cloud/image/authenticated/${options.folder}/${options.public_id}.pdf`
          });
        }
      };
    };

    try {
      const buffer = Buffer.from('test PDF document content');
      const res = await uploadBuffer(buffer, {
        folder: 'lifeledger/attachments/user_abc',
        publicId: 'receipt_789',
        resourceType: 'raw',
        deliveryType: 'authenticated'
      });

      assert.ok(streamEnded, 'Stream end must be called');
      assert.ok(capturedOptions, 'Upload options must be passed to upload_stream');
      assert.equal(capturedOptions.folder, 'lifeledger/attachments/user_abc');
      assert.equal(capturedOptions.public_id, 'receipt_789');
      assert.equal(capturedOptions.type, 'authenticated', 'Must use authenticated delivery type');
      assert.equal(capturedOptions.resource_type, 'raw');
      assert.equal(capturedOptions.overwrite, false);
      assert.equal(capturedOptions.unique_filename, true);
      assert.equal(capturedOptions.use_filename, false);

      assert.equal(res.publicId, 'lifeledger/attachments/user_abc/receipt_789');
      assert.equal(res.deliveryType, 'authenticated');
    } finally {
      cloudinary.uploader.upload_stream = originalUploadStream;
    }
  });

  test('4. uploadBuffer transforms Invalid Signature error into clear, actionable advice without leaking secrets', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'mock_cloud';
    process.env.CLOUDINARY_API_KEY = 'mock_key_1234567890';
    process.env.CLOUDINARY_API_SECRET = 'mock_secret_abcdef1234567890';
    configureCloudinary();

    const originalUploadStream = cloudinary.uploader.upload_stream;
    cloudinary.uploader.upload_stream = (options, callback) => {
      return {
        end: () => {
          callback(new Error('Invalid Signature 1234567890abcdef. String to sign: folder=test'));
        }
      };
    };

    try {
      await assert.rejects(
        async () => {
          await uploadBuffer(Buffer.from('sample'), { folder: 'test' });
        },
        (err) => {
          assert.ok(err.message.includes('Invalid Signature'));
          assert.ok(err.message.includes('CLOUDINARY_API_SECRET'));
          assert.ok(err.message.includes('server/.env'));
          // Ensure secret value is NOT printed
          assert.ok(!err.message.includes('mock_secret_abcdef1234567890'));
          return true;
        }
      );
    } finally {
      cloudinary.uploader.upload_stream = originalUploadStream;
    }
  });

  test('5. verifyCloudinaryConfig diagnostic function safely catches mismatch without leaking secrets', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'mock_cloud';
    process.env.CLOUDINARY_API_KEY = 'mock_key_1234567890';
    process.env.CLOUDINARY_API_SECRET = 'mock_secret_abcdef1234567890';
    configureCloudinary();

    const originalPing = cloudinary.api.ping;
    cloudinary.api.ping = async () => {
      const err = new Error('api_secret mismatch');
      err.http_code = 401;
      err.error = { message: 'api_secret mismatch', http_code: 401 };
      throw err;
    };

    try {
      const diag = await verifyCloudinaryConfig();
      assert.equal(diag.configured, true);
      assert.equal(diag.valid, false);
      assert.ok(diag.error.includes('Invalid Signature / API Secret mismatch'));
      assert.ok(!diag.error.includes('mock_secret_abcdef1234567890'));
    } finally {
      cloudinary.api.ping = originalPing;
    }
  });
});
