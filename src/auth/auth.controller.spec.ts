import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { AuthResponseDto, UserResponseDto } from './dto/auth.dto';

describe('AuthController', () => {
  const user: UserResponseDto = {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const tokens: AuthResponseDto = {
    accessToken: 'access',
    refreshToken: 'refresh',
    user,
  };
  const authService = {
    register: jest.fn().mockResolvedValue(tokens),
    login: jest.fn().mockResolvedValue(tokens),
    refresh: jest.fn().mockResolvedValue(tokens),
    logout: jest.fn().mockResolvedValue(undefined),
    me: jest.fn().mockResolvedValue(user),
  };
  const controller = new AuthController(authService as unknown as AuthService);
  const credentials = { email: user.email, password: 'correct-horse-battery' };

  beforeEach(() => jest.clearAllMocks());

  it('registers through the service', async () => {
    await expect(controller.register(credentials)).resolves.toBe(tokens);
    expect(authService.register).toHaveBeenCalledWith(credentials);
  });

  it('logs in through the service', async () => {
    await expect(controller.login(credentials)).resolves.toBe(tokens);
    expect(authService.login).toHaveBeenCalledWith(credentials);
  });

  it('passes the refresh token to refresh and logout', async () => {
    await expect(controller.refresh({ refreshToken: 'r1' })).resolves.toBe(
      tokens,
    );
    await expect(
      controller.logout({ refreshToken: 'r1' }),
    ).resolves.toBeUndefined();
    expect(authService.refresh).toHaveBeenCalledWith('r1');
    expect(authService.logout).toHaveBeenCalledWith('r1');
  });

  it('looks up the current user by the id in the token', async () => {
    const authUser = { id: user.id, email: user.email, role: user.role };
    await expect(controller.me(authUser)).resolves.toBe(user);
    expect(authService.me).toHaveBeenCalledWith(user.id);
  });
});
