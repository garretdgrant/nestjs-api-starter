import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Plaintext password for login',
    example: 'Str0ngP@ssword!',
  })
  @IsString()
  @Length(8, 128)
  password: string;
}
