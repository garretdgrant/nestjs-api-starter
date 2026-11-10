import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';

describe('auth DTO validation', () => {
  // Same options the application registers globally.
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
  const validate = <T>(metatype: new () => T, value: unknown): Promise<T> =>
    pipe.transform(value, { type: 'body', metatype });

  describe('RegisterDto', () => {
    it('trims and lowercases the email and trims the name', async () => {
      const dto = await validate(RegisterDto, {
        email: '  Alice@Example.COM ',
        password: 'correct-horse-battery',
        name: '  Alice Doe ',
      });
      expect(dto).toEqual({
        email: 'alice@example.com',
        password: 'correct-horse-battery',
        name: 'Alice Doe',
      });
    });

    it('accepts a registration without a name', async () => {
      await expect(
        validate(RegisterDto, {
          email: 'alice@example.com',
          password: 'correct-horse-battery',
        }),
      ).resolves.toBeInstanceOf(RegisterDto);
    });

    it.each([
      ['an invalid email', { email: 'nope', password: 'long-enough-pw' }],
      ['a non-string email', { email: 42, password: 'long-enough-pw' }],
      ['a short password', { email: 'a@example.com', password: 'short' }],
      [
        'a blank name',
        { email: 'a@example.com', password: 'long-enough-pw', name: '   ' },
      ],
      [
        'a non-string name',
        { email: 'a@example.com', password: 'long-enough-pw', name: 7 },
      ],
      [
        'a client-supplied role',
        { email: 'a@example.com', password: 'long-enough-pw', role: 'ADMIN' },
      ],
    ])('rejects %s', async (_label, body) => {
      await expect(validate(RegisterDto, body)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('LoginDto', () => {
    it('normalizes the email and does not enforce password length', async () => {
      const dto = await validate(LoginDto, {
        email: 'Alice@Example.com',
        password: 'old',
      });
      expect(dto).toEqual({ email: 'alice@example.com', password: 'old' });
    });

    it('rejects an empty password', async () => {
      await expect(
        validate(LoginDto, { email: 'alice@example.com', password: '' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('RefreshTokenDto', () => {
    it('requires a non-empty token', async () => {
      await expect(
        validate(RefreshTokenDto, { refreshToken: 'abc' }),
      ).resolves.toEqual({ refreshToken: 'abc' });
      await expect(validate(RefreshTokenDto, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
