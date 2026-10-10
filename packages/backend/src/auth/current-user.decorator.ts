import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  roleId?: string;
  permissionOverrides?: any;
  accountId: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload | undefined;
    if (!user) return null;
    const headerAccountId = request.headers['x-account-id'];
    const effectiveUser: CurrentUserPayload = {
      ...user,
      accountId:
        typeof headerAccountId === 'string' && headerAccountId.trim() !== ''
          ? headerAccountId.trim()
          : user.accountId,
    };
    return data ? effectiveUser[data] : effectiveUser;
  },
);
