import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SafeClient, SafeProject, SafeUser } from './auth.types';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    login: jest.fn(),
    clientSignup: jest.fn(),
  } as unknown as AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates login to service', async () => {
    const user = { id: 'u1', email: 'a@a.com' } as SafeUser;
    authServiceMock.login = jest
      .fn()
      .mockResolvedValue({ accessToken: 'token', user });

    const result = await controller.login({ email: 'a@a.com', password: 'p' });

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'a@a.com',
      password: 'p',
    });
    expect(result).toEqual({ accessToken: 'token', user });
  });

  it('delegates clientSignup to service', async () => {
    const user = { id: 'u1', email: 'a@a.com' } as SafeUser;
    const client = { id: 'c1', name: 'Acme' } as SafeClient;
    const project = { id: 'p1', name: 'Website', clientId: 'c1' } as SafeProject;
    authServiceMock.clientSignup = jest.fn().mockResolvedValue({
      accessToken: 'token',
      user,
      client,
      project,
    });

    const result = await controller.clientSignup({
      contactName: 'Alice',
      companyName: 'Acme',
      email: 'a@a.com',
      password: 'p',
      projectName: 'Website',
    });

    expect(authServiceMock.clientSignup).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: 'token', user, client, project });
  });

  it('returns req.user for /me', () => {
    const user = { id: 'u1', email: 'a@a.com' } as SafeUser;
    const result = controller.me({ user });
    expect(result).toEqual(user);
  });
});

