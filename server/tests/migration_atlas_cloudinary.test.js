const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./helpers/testDb');
const { connectDB, sanitizeUri } = require('../src/config/db');
const { generateSignedUrl, isCloudinaryConfigured } = require('../src/config/cloudinary');
const { uploadAttachmentFile } = require('../src/services/storage.service');

describe('LifeLedger — MongoDB Atlas & Cloudinary Migration Verification Tests', () => {
  let userAToken, userBToken;
  let userAId, userBId;

  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_jwt_secret_atlas_cloudinary';
    await connectTestDB();
  });

  after(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'User Atlas A',
      email: 'atlas_a@example.com',
      password: 'Password123!'
    });
    userAToken = resA.body.data.token;
    userAId = resA.body.data.user.id;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'User Atlas B',
      email: 'atlas_b@example.com',
      password: 'Password123!'
    });
    userBToken = resB.body.data.token;
    userBId = resB.body.data.user.id;
  });

  // ========================================================
  // 1. MongoDB Atlas Configuration & Production Fail-Fast
  // ========================================================
  describe('1. MongoDB Atlas Configuration & Fail-Fast Lifecycle', () => {
    test('sanitizeUri correctly obscures credentials in connection strings', () => {
      const srvUri = 'mongodb+srv://admin_user:SuperSecretPassword123@cluster0.abcde.mongodb.net/lifeledger?retryWrites=true&w=majority';
      const sanitized = sanitizeUri(srvUri);

      assert.ok(!sanitized.includes('SuperSecretPassword123'), 'Sanitized URI must not contain password');
      assert.ok(sanitized.includes('admin_user:***@'), 'Sanitized URI must replace password with ***');
      assert.ok(sanitized.startsWith('mongodb+srv://'));
    });

    test('In production mode, connectDB fails fast if MONGODB_URI is missing', () => {
      const cp = require('child_process');
      const out = cp.execSync(
        'node -e "process.env.NODE_ENV=\'production\'; delete process.env.MONGODB_URI; const { connectDB } = require(\'./src/config/db\'); connectDB().catch(e => console.log(\'FAIL_FAST:\', e.message));"'
      ).toString();

      assert.ok(out.includes('FAIL_FAST: MONGODB_URI environment variable is required in production'));
    });
  });

  // ========================================================
  // 2. Cloudinary Upload, Private Delivery, and Cleanup
  // ========================================================
  describe('2. Cloudinary Upload, Metadata Modeling & Signed URLs', () => {
    test('generateSignedUrl generates time-limited authenticated access URLs', () => {
      const publicId = 'lifeledger/attachments/user123/receipt_12345';
      const signedUrl = generateSignedUrl(publicId, {
        resourceType: 'raw',
        deliveryType: 'authenticated',
        format: 'pdf',
        isDownload: false,
        expiresInSeconds: 300
      });

      assert.ok(signedUrl.startsWith('https://api.cloudinary.com/'), 'Must use Cloudinary API delivery endpoint');
      assert.ok(signedUrl.includes('expires_at='), 'Must include expires_at parameter');
      assert.ok(signedUrl.includes('signature='), 'Must include signature parameter');
      assert.ok(signedUrl.includes('type=authenticated'), 'Must enforce authenticated type');
      assert.ok(signedUrl.includes('attachment=false'), 'Inline view must set attachment=false');

      const downloadSignedUrl = generateSignedUrl(publicId, {
        resourceType: 'raw',
        deliveryType: 'authenticated',
        format: 'pdf',
        isDownload: true,
        expiresInSeconds: 300
      });
      assert.ok(downloadSignedUrl.includes('attachment=true'), 'Download must set attachment=true');
    });

    test('Uploads file and returns safe metadata without leaking publicId or storagePath', async () => {
      // 1. Create obligation for User A
      const obsRes = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Cloudinary Test Obligation',
          category: 'subscription',
          dueDate: '2026-11-30',
          amount: 799
        });
      const obligationId = obsRes.body.data._id;

      // 2. Upload file
      const uploadRes = await request(app)
        .post(`/api/obligations/${obligationId}/attachments`)
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', Buffer.from('Mock Cloudinary invoice receipt'), 'invoice.pdf');

      assert.equal(uploadRes.status, 201);
      assert.equal(uploadRes.body.success, true);
      assert.equal(uploadRes.body.data.originalName, 'invoice.pdf');
      assert.equal(uploadRes.body.data.mimeType, 'application/pdf');

      // Security check: internal identifiers must be stripped from response
      assert.equal(uploadRes.body.data.publicId, undefined, 'publicId must be stripped');
      assert.equal(uploadRes.body.data.storagePath, undefined, 'storagePath must be stripped');
      assert.equal(uploadRes.body.data.deliveryType, undefined, 'deliveryType must be stripped');
      assert.equal(uploadRes.body.data.resourceType, undefined, 'resourceType must be stripped');

      const attachmentId = uploadRes.body.data._id;

      // 3. User A views attachment: receives 302 redirect to signed URL
      const viewRes = await request(app)
        .get(`/api/obligations/${obligationId}/attachments/${attachmentId}/view`)
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(viewRes.status, 302);
      assert.ok(viewRes.headers.location);

      // 4. User A downloads attachment: receives 302 redirect with attachment flag
      const downloadRes = await request(app)
        .get(`/api/obligations/${obligationId}/attachments/${attachmentId}/download`)
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(downloadRes.status, 302);
      assert.ok(downloadRes.headers.location);

      // 5. User B receives 404 when attempting to access User A attachment
      const viewResB = await request(app)
        .get(`/api/obligations/${obligationId}/attachments/${attachmentId}/view`)
        .set('Authorization', `Bearer ${userBToken}`);
      assert.equal(viewResB.status, 404);

      // 6. User B receives 404 when attempting to delete User A attachment
      const deleteResB = await request(app)
        .delete(`/api/obligations/${obligationId}/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      assert.equal(deleteResB.status, 404);

      // 7. User A deletes attachment successfully
      const deleteResA = await request(app)
        .delete(`/api/obligations/${obligationId}/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(deleteResA.status, 200);

      // Verify attachment was removed from obligation
      const getObs = await request(app)
        .get(`/api/obligations/${obligationId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(getObs.body.data.attachments.length, 0);
    });

    test('Activity history records Cloudinary attachment upload and deletion events', async () => {
      const obsRes = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Audit Trail Insurance Doc',
          category: 'insurance',
          dueDate: '2026-12-31'
        });
      const obligationId = obsRes.body.data._id;

      const uploadRes = await request(app)
        .post(`/api/obligations/${obligationId}/attachments`)
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', Buffer.from('Insurance certificate'), 'policy.pdf');
      const attachmentId = uploadRes.body.data._id;

      await request(app)
        .delete(`/api/obligations/${obligationId}/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      const actRes = await request(app)
        .get('/api/activity')
        .set('Authorization', `Bearer ${userAToken}`);

      const actions = actRes.body.data.map((a) => a.action);
      assert.ok(actions.includes('attachment_uploaded'), 'Should log attachment_uploaded activity');
      assert.ok(actions.includes('attachment_deleted'), 'Should log attachment_deleted activity');

      // User B activity is isolated and empty
      const actResB = await request(app)
        .get('/api/activity')
        .set('Authorization', `Bearer ${userBToken}`);
      assert.equal(actResB.body.data.length, 0);
    });

    test('Deleting an obligation cleanly removes its attachments without leaving dangling records', async () => {
      const obsRes = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Cleanup Obligation',
          category: 'bill',
          dueDate: '2026-11-25'
        });
      const obligationId = obsRes.body.data._id;

      await request(app)
        .post(`/api/obligations/${obligationId}/attachments`)
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', Buffer.from('Monthly statement'), 'statement.pdf');

      const delRes = await request(app)
        .delete(`/api/obligations/${obligationId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(delRes.status, 200);

      const checkRes = await request(app)
        .get(`/api/obligations/${obligationId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(checkRes.status, 404);
    });
  });
});
