import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    // If a token was provided but failed validation, throw 401 so the client can refresh
    if (authHeader && (err || !user)) {
      throw err || new UnauthorizedException('Access token expired or invalid');
    }

    // If a valid user was authenticated from the token, return it
    if (user) {
      return user;
    }

    // Fallback for unauthenticated demo browsing: attach default demo account context
    return {
      id: 'user-alex',
      email: 'alex@backnode.io',
      name: 'Alex Wong',
      role: 'OWNER',
      accountId: 'acc-default',
    };
  }
}

@Injectable()
export class StrictJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
