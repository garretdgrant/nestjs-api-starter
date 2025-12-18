import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('is an AuthGuard("jwt") instance', () => {
    const BaseGuard = AuthGuard('jwt');
    const guard = new JwtAuthGuard();
    expect(guard).toBeInstanceOf(BaseGuard as unknown as new () => object);
  });

  it('delegates canActivate to parent', () => {
    const guard = new JwtAuthGuard();
    const parentProto = Object.getPrototypeOf(JwtAuthGuard.prototype);
    jest.spyOn(parentProto, 'canActivate').mockReturnValue(true as any);
    const result = guard.canActivate({} as any);
    expect(parentProto.canActivate).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
