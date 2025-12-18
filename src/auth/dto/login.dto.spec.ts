import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto validation', () => {
  it('accepts a valid email and password', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'user@example.com',
      password: 'password123',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid email and short password', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'bad',
      password: '123',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

