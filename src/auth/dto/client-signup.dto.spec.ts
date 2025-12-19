import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ClientSignupDto } from './client-signup.dto';

describe('ClientSignupDto validation', () => {
  it('trims and normalizes fields', async () => {
    const dto = plainToInstance(ClientSignupDto, {
      contactName: ' Alice ',
      companyName: ' Acme Co ',
      email: ' Alice@Example.com ',
      password: 'supersecret',
      projectName: ' Website ',
      signUpSecret: 'signup-secret-123',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.contactName).toBe('Alice');
    expect(dto.companyName).toBe('Acme Co');
    expect(dto.email).toBe('alice@example.com');
    expect(dto.projectName).toBe('Website');
  });

  it('fails validation for bad email and short password', async () => {
    const dto = plainToInstance(ClientSignupDto, {
      contactName: '',
      companyName: 'A',
      email: 'not-an-email',
      password: 'short',
      projectName: 'P',
      signUpSecret: 'short',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
