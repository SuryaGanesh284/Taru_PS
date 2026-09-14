const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a user with 200 OK and return user and token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Radha Devi',
          email: 'radha@example.com',
          phone: '+91 98765 43210',
          password: 'password123',
          role: 'seller',
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('radha@example.com');
      expect(res.body.data.user.role).toBe('SELLER');
      expect(res.body.data.user.phone).toBe('9876543210');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should register with email and optional empty phone', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Suresh Kumar',
          email: 'suresh@example.com',
          phone: '',
          password: 'securePassword123',
          role: 'BUYER',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('suresh@example.com');
    });

    it('should return 422 VALIDATION_ERROR when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: '',
          password: 'short',
        });

      expect(res.status).toBe(422);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeDefined();
      expect(res.body.error.details.name).toBeDefined();
      expect(res.body.error.details.password).toBeDefined();
    });

    it('should return 422 when phone number format is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Pooja',
          email: 'pooja@example.com',
          phone: '12345',
          password: 'password123',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.phone).toBeDefined();
    });

    it('should return 409 when user with email already exists', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'First User',
          email: 'duplicate@example.com',
          password: 'password123',
        });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Second User',
          email: 'duplicate@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('USER_EXISTS');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Login Test',
          email: 'login@example.com',
          phone: '9876500000',
          password: 'correctPassword123',
        });
    });

    it('should login with email and password returning 200 OK', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'correctPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('login@example.com');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should login with phone number and password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          phone: '+91 98765 00000',
          password: 'correctPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('login@example.com');
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should return 401 when password is incorrect', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 422 when password or identifier is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: '',
          password: '',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 400 MISSING_REFRESH_TOKEN when no token provided', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_REFRESH_TOKEN');
    });

    it('should refresh token from cookie and return new access token with 200 OK', async () => {
      const reg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Refresh Test',
          email: 'refresh@example.com',
          password: 'password123',
        });

      const cookies = reg.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    });

    it('should refresh token from request body', async () => {
      const reg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Body Refresh',
          email: 'bodyrefresh@example.com',
          password: 'password123',
        });

      const rawCookie = reg.headers['set-cookie'][0];
      const refreshToken = rawCookie.split(';')[0].split('=')[1];

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 NO_TOKEN when authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('NO_TOKEN');
    });

    it('should return authenticated user with 200 OK', async () => {
      const reg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Profile User',
          email: 'profile@example.com',
          password: 'password123',
        });

      const token = reg.body.data.accessToken;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('profile@example.com');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should clear cookie and return 200 OK', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Logged out successfully');
    });
  });
});
