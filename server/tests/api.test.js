const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./helpers/testDb');

describe('LifeLedger API Integration & Security Tests', () => {
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
  });

  describe('1. Health Check', () => {
    test('GET /api/health returns 200 with ok status', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ok');
      assert.equal(res.body.service, 'LifeLedger API');
    });
  });

  describe('2. Authentication Workflows', () => {
    test('POST /api/auth/register creates user and returns token', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Alice Johnson',
        email: 'Alice@example.com',
        password: 'password123'
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.name, 'Alice Johnson');
      assert.equal(res.body.data.user.email, 'alice@example.com'); // normalized
      assert.ok(res.body.data.token);
      assert.equal(res.body.data.user.passwordHash, undefined); // never exposed
    });

    test('POST /api/auth/register rejects duplicate email with 409', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'password123'
      });

      const duplicateRes = await request(app).post('/api/auth/register').send({
        name: 'Alice Two',
        email: 'alice@example.com',
        password: 'password456'
      });

      assert.equal(duplicateRes.status, 409);
      assert.equal(duplicateRes.body.success, false);
    });

    test('POST /api/auth/register rejects invalid inputs with 400', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: '',
        email: 'not-an-email',
        password: '123' // too short
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    test('POST /api/auth/login authenticates valid user', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'password123'
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'bob@example.com',
        password: 'password123'
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
    });

    test('POST /api/auth/login rejects wrong password with 401', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'password123'
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'bob@example.com',
        password: 'wrongpassword'
      });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    test('GET /api/auth/me returns current user info', async () => {
      const reg = await request(app).post('/api/auth/register').send({
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'password123'
      });

      const token = reg.body.data.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.email, 'charlie@example.com');
    });

    test('GET /api/auth/me returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });
  });

  describe('3. Obligation Lifecycle & Validation', () => {
    let token;

    beforeEach(async () => {
      const reg = await request(app).post('/api/auth/register').send({
        name: 'User One',
        email: 'user1@example.com',
        password: 'password123'
      });
      token = reg.body.data.token;
    });

    test('POST /api/obligations creates new obligation', async () => {
      const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Netflix Subscription',
          category: 'subscription',
          dueDate,
          amount: 649,
          currency: 'INR',
          priority: 'high',
          recurrence: 'monthly'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.title, 'Netflix Subscription');
      assert.equal(res.body.data.amount, 649);
      assert.equal(res.body.data.urgency, 'due-soon');
      assert.equal(res.body.data.status, 'active');
    });

    test('POST /api/obligations rejects missing title or invalid amount', async () => {
      const res = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '',
          dueDate: new Date().toISOString(),
          amount: -50 // invalid negative amount
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    test('PATCH /api/obligations/:id updates allowed fields', async () => {
      const dueDate = new Date().toISOString();
      const createRes = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Electricity Bill',
          category: 'bill',
          dueDate,
          amount: 1500
        });

      const obligationId = createRes.body.data._id;

      const updateRes = await request(app)
        .patch(`/api/obligations/${obligationId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Electricity Bill (Updated)',
          amount: 1750
        });

      assert.equal(updateRes.status, 200);
      assert.equal(updateRes.body.data.title, 'Electricity Bill (Updated)');
      assert.equal(updateRes.body.data.amount, 1750);
    });

    test('PATCH /api/obligations/:id/complete marks obligation completed', async () => {
      const createRes = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Gym Membership',
          category: 'subscription',
          dueDate: new Date().toISOString()
        });

      const obligationId = createRes.body.data._id;

      const completeRes = await request(app)
        .patch(`/api/obligations/${obligationId}/complete`)
        .set('Authorization', `Bearer ${token}`);

      assert.equal(completeRes.status, 200);
      assert.equal(completeRes.body.data.status, 'completed');
      assert.ok(completeRes.body.data.completedAt);
    });

    test('PATCH /api/obligations/:id/cancel marks obligation cancelled', async () => {
      const createRes = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Magazine Subscription',
          category: 'subscription',
          dueDate: new Date().toISOString()
        });

      const obligationId = createRes.body.data._id;

      const cancelRes = await request(app)
        .patch(`/api/obligations/${obligationId}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      assert.equal(cancelRes.status, 200);
      assert.equal(cancelRes.body.data.status, 'cancelled');
    });

    test('DELETE /api/obligations/:id deletes obligation', async () => {
      const createRes = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Temporary Task',
          category: 'custom',
          dueDate: new Date().toISOString()
        });

      const obligationId = createRes.body.data._id;

      const delRes = await request(app)
        .delete(`/api/obligations/${obligationId}`)
        .set('Authorization', `Bearer ${token}`);

      assert.equal(delRes.status, 200);

      // Verify it is gone
      const getRes = await request(app)
        .get(`/api/obligations/${obligationId}`)
        .set('Authorization', `Bearer ${token}`);

      assert.equal(getRes.status, 404);
    });
  });

  describe('4. User-Level Data Isolation (Multi-Tenant Security)', () => {
    let tokenUserA;
    let tokenUserB;
    let obligationAId;

    beforeEach(async () => {
      const regA = await request(app).post('/api/auth/register').send({
        name: 'User A',
        email: 'userA@example.com',
        password: 'password123'
      });
      tokenUserA = regA.body.data.token;

      const regB = await request(app).post('/api/auth/register').send({
        name: 'User B',
        email: 'userB@example.com',
        password: 'password123'
      });
      tokenUserB = regB.body.data.token;

      // User A creates an obligation
      const createRes = await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          title: 'User A Private Secret Obligation',
          category: 'bill',
          dueDate: new Date().toISOString(),
          amount: 50000
        });
      obligationAId = createRes.body.data._id;
    });

    test('User B cannot view User A obligation (404 without disclosure)', async () => {
      const res = await request(app)
        .get(`/api/obligations/${obligationAId}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });

    test('User B obligation list does not contain User A obligations', async () => {
      const res = await request(app)
        .get('/api/obligations')
        .set('Authorization', `Bearer ${tokenUserB}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.count, 0);
      assert.deepEqual(res.body.data, []);
    });

    test('User B cannot edit User A obligation', async () => {
      const res = await request(app)
        .patch(`/api/obligations/${obligationAId}`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ title: 'Hacked Title' });

      assert.equal(res.status, 404);
    });

    test('User B cannot delete User A obligation', async () => {
      const res = await request(app)
        .delete(`/api/obligations/${obligationAId}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      assert.equal(res.status, 404);
    });
  });

  describe('5. Dashboard Urgency, Money Leak Detector & Financial Summary', () => {
    let token;

    beforeEach(async () => {
      const reg = await request(app).post('/api/auth/register').send({
        name: 'Dashboard Tester',
        email: 'dashboard@example.com',
        password: 'password123'
      });
      token = reg.body.data.token;

      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      // 1. Overdue bill
      await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Overdue Internet Bill',
          category: 'bill',
          dueDate: new Date(now - 3 * oneDay).toISOString(),
          amount: 1000,
          status: 'active'
        });

      // 2. Due soon subscription (recurring monthly)
      await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Cloud Storage',
          category: 'subscription',
          dueDate: new Date(now + 2 * oneDay).toISOString(),
          amount: 500,
          recurrence: 'monthly',
          status: 'active'
        });

      // 3. Due soon return window
      await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Monitor Return Window',
          category: 'return-window',
          dueDate: new Date(now + 5 * oneDay).toISOString(),
          amount: 15000,
          status: 'active'
        });

      // 4. Completed item (should NOT be counted in money leak or recurring)
      await request(app)
        .post('/api/obligations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Old Paid Bill',
          category: 'bill',
          dueDate: new Date(now - 10 * oneDay).toISOString(),
          amount: 2000,
          status: 'completed'
        });
    });

    test('GET /api/dashboard/summary calculates correct metrics and money leaks', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      const { counts, moneyLeakAlerts, financialSummary } = res.body.data;

      assert.equal(counts.total, 4);
      assert.equal(counts.active, 3);
      assert.equal(counts.completed, 1);
      assert.equal(counts.overdue, 1);
      assert.equal(counts.dueSoon, 2);

      // Money leak detector should highlight the active overdue and due-soon items
      assert.equal(moneyLeakAlerts.length, 3);
      const overdueAlert = moneyLeakAlerts.find((a) => a.urgency === 'overdue');
      assert.ok(overdueAlert);
      assert.equal(overdueAlert.title, 'Overdue Internet Bill');
      assert.ok(overdueAlert.reason.includes('Overdue'));

      // Financial summary
      assert.equal(financialSummary.monthlyRecurring, 500);
      assert.equal(financialSummary.annualEstimate, 6000); // 500 * 12
      assert.equal(financialSummary.label, 'Estimates based on user-entered information');
    });

    test('GET /api/obligations?search=Monitor filters correctly', async () => {
      const res = await request(app)
        .get('/api/obligations?search=Monitor')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.count, 1);
      assert.equal(res.body.data[0].title, 'Monitor Return Window');
    });

    test('GET /api/obligations?category=subscription filters correctly', async () => {
      const res = await request(app)
        .get('/api/obligations?category=subscription')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.count, 1);
      assert.equal(res.body.data[0].title, 'Cloud Storage');
    });
  });
});
