import { IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
}
