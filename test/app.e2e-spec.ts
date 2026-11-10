import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { InMemoryPrisma } from './support/in-memory-prisma';

describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: InMemoryPrisma;

  const credentials = {
    email: 'alice@example.com',
    password: 'correct-horse-battery',
  };

  beforeEach(async () => {
    prisma = new InMemoryPrisma();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const register = () =>
    request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...credentials, name: 'Alice' });

  it('serves /health without a token', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ statusCode: 200, message: 'OK' });
  });

  it('rejects protected routes without a valid token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);
  });

  it('registers a user and returns tokens without the password hash', async () => {
    const response = await register().expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: credentials.email,
      name: 'Alice',
      role: 'USER',
    });
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(prisma.users[0].passwordHash).not.toContain(credentials.password);
  });

  it('normalizes the email and rejects a duplicate registration', async () => {
    await register().expect(201);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...credentials, email: '  Alice@Example.com ' })
      .expect(409);
  });

  it('validates the registration body', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...credentials, role: 'ADMIN' })
      .expect(400);
  });

  it('logs in with the right password only', async () => {
    await register().expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...credentials, password: 'wrong-password' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: credentials.password })
      .expect(401);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
  });

  it('returns the signed-in user from /auth/me', async () => {
    const { body } = await register().expect(201);

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(200);
    expect(response.body).toMatchObject({
      id: body.user.id,
      email: credentials.email,
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('rotates refresh tokens and revokes every session on reuse', async () => {
    const { body: first } = await register().expect(201);

    const { body: second } = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: first.refreshToken })
      .expect(200);
    expect(second.refreshToken).not.toEqual(first.refreshToken);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${second.accessToken}`)
      .expect(200);

    // Replaying the spent token fails and also kills its successor.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: first.refreshToken })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: second.refreshToken })
      .expect(401);
  });

  it('revokes the refresh token on logout', async () => {
    const { body } = await register().expect(201);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: body.refreshToken })
      .expect(204);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: body.refreshToken })
      .expect(401);
  });
});
