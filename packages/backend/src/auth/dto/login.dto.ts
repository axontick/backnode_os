import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please enter a valid work email' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
