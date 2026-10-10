import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities';

export interface JwtPayload {
  sub: string;
  email: string;
  accountId: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'backnode-os-super-secret-jwt-key-2026',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: { account: true },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists or session invalid');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roleId: user.roleId,
      permissionOverrides: user.permissionOverrides,
      accountId: user.accountId,
      account: user.account,
    };
  }
}
