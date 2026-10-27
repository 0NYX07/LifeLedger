const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./helpers/testDb');
const { computeNextDueDate, isLeapYear, getDaysInMonth } = require('../src/utils/recurrence');

describe('LifeLedger Phase 7 — Advanced Features Integration & Security Tests', () => {
  let userAToken, userBToken;
  let userAId, userBId;

  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret_key_12345';
    await connectTestDB();
  });

  after(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'User Alpha',
      email: 'alpha@example.com',
      password: 'password123'
    });
    userAToken = resA.body.data.token;
    userAId = resA.body.data.user._id;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'User Beta',
      email: 'beta@example.com',
      password: 'password123'
    });
    userBToken = resB.body.data.token;
    userBId = resB.body.data.user._id;
  });

  // ==========================================
  // Feature A: Secure Document Attachments
  // ==========================================
  describe('Feature A: Secure Document Attachments', () => {
    test('Uploads, views, downloads, and deletes attachment with strict ownership isolation', async () => {
      // 1. Create an obligation for User A
      const obsRes = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Laptop Warranty',
          category: 'warranty',
          dueDate: '2026-12-31',
          amount: 1500
        });
      assert.equal(obsRes.status, 201);
      const obligationId = obsRes.body.data._id;

      // 2. Upload a valid text document
      const fileContent = 'Official warranty certificate receipt content.';
      const uploadRes = await request(app)
        .post(`/api/obligations/${obligationId}/attachments`)
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', Buffer.from(fileContent), 'warranty_receipt.txt');

      assert.equal(uploadRes.status, 201);
      assert.equal(uploadRes.body.success, true);
      assert.equal(uploadRes.body.data.originalName, 'warranty_receipt.txt');
      assert.equal(uploadRes.body.data.mimeType, 'text/plain');
      const attachmentId = uploadRes.body.data._id;

      // 3. View attachment inline (User A)
      const viewRes = await request(app)
        .get(`/api/obligations/${obligationId}/attachments/${attachmentId}/view`)
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(viewRes.status, 200);
      assert.match(viewRes.headers['content-type'], /text\/plain/);
      assert.match(viewRes.headers['content-disposition'], /inline/);
      assert.equal(viewRes.text, fileContent);

      // 4. Download attachment (User A)
      const downloadRes = await request(app)
        .get(`/api/obligations/${obligationId}/attachments/${attachmentId}/download`)
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(downloadRes.status, 200);
      assert.match(downloadRes.headers['content-disposition'], /attachment/);

      // 5. User B CANNOT view or download User A attachment (404 without disclosure)
      const viewResB = await request(app)
        .get(`/api/obligations/${obligationId}/attachments/${attachmentId}/view`)
        .set('Authorization', `Bearer ${userBToken}`);
      assert.equal(viewResB.status, 404);

      const downloadResB = await request(app)
        .get(`/api/obligations/${obligationId}/attachments/${attachmentId}/download`)
        .set('Authorization', `Bearer ${userBToken}`);
      assert.equal(downloadResB.status, 404);

      // 6. User B CANNOT delete User A attachment
      const deleteResB = await request(app)
        .delete(`/api/obligations/${obligationId}/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      assert.equal(deleteResB.status, 404);

      // 7. User A deletes attachment (parent obligation remains intact)
      const deleteResA = await request(app)
        .delete(`/api/obligations/${obligationId}/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(deleteResA.status, 200);

      // Verify parent obligation still exists and has 0 attachments
      const parentObs = await request(app)
        .get(`/api/obligations/${obligationId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(parentObs.status, 200);
      assert.equal(parentObs.body.data.attachments.length, 0);
    });

    test('Rejects invalid file types and oversized files', async () => {
      const obsRes = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Subscription Document Test',
          category: 'subscription',
          dueDate: '2026-11-15'
        });
      const obligationId = obsRes.body.data._id;

      // Rejects executable file
      const exeRes = await request(app)
        .post(`/api/obligations/${obligationId}/attachments`)
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', Buffer.from('binary-data'), 'malicious.exe');

      assert.equal(exeRes.status, 400);
      assert.match(exeRes.body.message, /Invalid file type/);

      // Rejects script file
      const shRes = await request(app)
        .post(`/api/obligations/${obligationId}/attachments`)
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', Buffer.from('echo test'), 'script.sh');

      assert.equal(shRes.status, 400);

      // Rejects oversized file (> 5MB)
      const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024, 'a');
      const largeRes = await request(app)
        .post(`/api/obligations/${obligationId}/attachments`)
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', largeBuffer, 'huge_file.txt');

      assert.equal(largeRes.status, 400);
      assert.match(largeRes.body.message, /exceeds maximum limit/);
    });
  });

  // ==========================================
  // Feature B: Simple Monthly/Yearly Recurrence
  // ==========================================
  describe('Feature B: Recurrence & Date Boundaries', () => {
    test('computeNextDueDate handles month-end clamping and leap years predictably', () => {
      // 1. Jan 31 -> Feb 28 on a non-leap year (e.g. 2025)
      const jan31 = new Date(Date.UTC(2025, 0, 31));
      const nextFeb = computeNextDueDate(jan31, 'monthly');
      assert.equal(nextFeb.getUTCFullYear(), 2025);
      assert.equal(nextFeb.getUTCMonth(), 1); // Feb
      assert.equal(nextFeb.getUTCDate(), 28); // Clamped to 28

      // 2. Jan 31 -> Feb 29 on a leap year (e.g. 2024)
      const jan31_leap = new Date(Date.UTC(2024, 0, 31));
      const nextFeb_leap = computeNextDueDate(jan31_leap, 'monthly');
      assert.equal(nextFeb_leap.getUTCFullYear(), 2024);
      assert.equal(nextFeb_leap.getUTCMonth(), 1); // Feb
      assert.equal(nextFeb_leap.getUTCDate(), 29); // Clamped to 29

      // 3. March 31 -> April 30
      const mar31 = new Date(Date.UTC(2026, 2, 31));
      const nextApr = computeNextDueDate(mar31, 'monthly');
      assert.equal(nextApr.getUTCMonth(), 3); // April
      assert.equal(nextApr.getUTCDate(), 30); // Clamped to 30

      // 4. Feb 29 on leap year (2024) -> Feb 28 on non-leap year (2025) for yearly recurrence
      const feb29 = new Date(Date.UTC(2024, 1, 29));
      const nextYearly = computeNextDueDate(feb29, 'yearly');
      assert.equal(nextYearly.getUTCFullYear(), 2025);
      assert.equal(nextYearly.getUTCMonth(), 1); // Feb
      assert.equal(nextYearly.getUTCDate(), 28); // Clamped to 28
    });

    test('Completing a recurring obligation automatically schedules the next cycle idempotently', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Create a monthly recurring subscription
      const obsRes = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Claude Pro Subscription',
          category: 'subscription',
          dueDate: today,
          amount: 1999,
          recurrence: 'monthly'
        });
      assert.equal(obsRes.status, 201);
      const originalId = obsRes.body.data._id;

      // Mark original completed
      const completeRes = await request(app)
        .patch(`/api/obligations/${originalId}/complete`)
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(completeRes.status, 200);
      assert.equal(completeRes.body.data.status, 'completed');
      assert.ok(completeRes.body.nextOccurrence, 'Next occurrence should be returned');
      assert.equal(completeRes.body.nextOccurrence.status, 'active');
      assert.equal(completeRes.body.nextOccurrence.title, 'Claude Pro Subscription');
      assert.equal(completeRes.body.nextOccurrence.recurrence, 'monthly');

      // Idempotency check: completing again does NOT create another duplicate occurrence
      const completeAgainRes = await request(app)
        .patch(`/api/obligations/${originalId}/complete`)
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(completeAgainRes.status, 200);
      assert.equal(completeAgainRes.body.nextOccurrence, null); // already exists

      // Query active obligations for User A: should have exactly 1 active occurrence
      const listRes = await request(app)
        .get('/api/obligations?status=active')
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(listRes.status, 200);
      const matching = listRes.body.data.filter((o) => o.title === 'Claude Pro Subscription');
      assert.equal(matching.length, 1);
    });

    test('One-time obligations do not generate future occurrences when completed', async () => {
      const obsRes = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'One-time Book Purchase',
          category: 'purchase',
          dueDate: '2026-11-20',
          amount: 500,
          recurrence: 'none'
        });
      const originalId = obsRes.body.data._id;

      const completeRes = await request(app)
        .patch(`/api/obligations/${originalId}/complete`)
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(completeRes.status, 200);
      assert.equal(completeRes.body.nextOccurrence, null);
    });
  });

  // ==========================================
  // Feature C: Activity History
  // ==========================================
  describe('Feature C: Activity History & Audit Trail', () => {
    test('Logs lifecycle events and enforces user-level isolation and pagination', async () => {
      // 1. User A creates an obligation
      const obsRes = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Gym Membership',
          category: 'subscription',
          dueDate: '2026-12-01',
          amount: 2500,
          recurrence: 'monthly'
        });
      const obligationId = obsRes.body.data._id;

      // 2. User A updates the obligation
      await request(app)
        .patch(`/api/obligations/${obligationId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: 2800 });

      // 3. User A marks obligation completed (generates next recurrence)
      await request(app)
        .patch(`/api/obligations/${obligationId}/complete`)
        .set('Authorization', `Bearer ${userAToken}`);

      // 4. Fetch User A activity
      const activityResA = await request(app)
        .get('/api/activity')
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(activityResA.status, 200);
      assert.equal(activityResA.body.success, true);
      assert.ok(activityResA.body.data.length >= 3);

      const actions = activityResA.body.data.map((a) => a.action);
      assert.ok(actions.includes('created'), 'Should include created action');
      assert.ok(actions.includes('updated'), 'Should include updated action');
      assert.ok(actions.includes('completed'), 'Should include completed action');
      assert.ok(actions.includes('recurrence_generated'), 'Should include recurrence_generated action');

      // 5. User B activity must be completely empty (User Isolation)
      const activityResB = await request(app)
        .get('/api/activity')
        .set('Authorization', `Bearer ${userBToken}`);
      assert.equal(activityResB.status, 200);
      assert.equal(activityResB.body.data.length, 0);

      // 6. Delete obligation and verify deleted event is retained with title
      await request(app)
        .delete(`/api/obligations/${obligationId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      const activityAfterDelete = await request(app)
        .get('/api/activity?action=deleted')
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(activityAfterDelete.status, 200);
      assert.equal(activityAfterDelete.body.data.length, 1);
      assert.equal(activityAfterDelete.body.data[0].title, 'Gym Membership');
      assert.equal(activityAfterDelete.body.data[0].action, 'deleted');
    });
  });

  // ==========================================
  // Feature D: In-App Notifications
  // ==========================================
  describe('Feature D: In-App Notifications', () => {
    test('Syncs due/overdue alerts idempotently, supports read/mark-all, and preserves user isolation', async () => {
      // 1. Create an overdue obligation for User A
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Unpaid Electric Bill',
          category: 'bill',
          dueDate: pastDate,
          amount: 1450
        });

      // 2. Fetch notifications for User A
      const notifResA = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(notifResA.status, 200);
      assert.ok(notifResA.body.unreadCount >= 1);
      const overdueNotif = notifResA.body.data.find((n) => n.type === 'overdue');
      assert.ok(overdueNotif, 'Should generate overdue notification');
      assert.match(overdueNotif.title, /Overdue: Unpaid Electric Bill/);
      assert.equal(overdueNotif.isRead, false);

      // 3. Idempotency: fetching again does NOT duplicate the notification
      const notifResA2 = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userAToken}`);
      const countOverdue = notifResA2.body.data.filter((n) => n.type === 'overdue');
      assert.equal(countOverdue.length, 1, 'Duplicate notifications must not be generated');

      // 4. Mark single notification as read
      const markReadRes = await request(app)
        .patch(`/api/notifications/${overdueNotif._id}/read`)
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(markReadRes.status, 200);
      assert.equal(markReadRes.body.data.isRead, true);

      // 5. Mark all as read
      const markAllRes = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(markAllRes.status, 200);

      const afterMarkAll = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userAToken}`);
      assert.equal(afterMarkAll.body.unreadCount, 0);

      // 6. User B cannot see User A notifications
      const notifResB = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userBToken}`);
      assert.equal(notifResB.status, 200);
      assert.equal(notifResB.body.unreadCount, 0);
      assert.equal(notifResB.body.data.length, 0);

      // 7. User B cannot mark User A notification as read
      const markBRes = await request(app)
        .patch(`/api/notifications/${overdueNotif._id}/read`)
        .set('Authorization', `Bearer ${userBToken}`);
      assert.equal(markBRes.status, 404);
    });
  });
});
