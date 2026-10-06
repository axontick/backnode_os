import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'Please enter a valid work email' })
  email: string;

  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsNotEmpty({ message: 'Full name is required' })
  name: string;

  @IsNotEmpty({ message: 'Workspace or organization name is required' })
  accountName: string;
}
