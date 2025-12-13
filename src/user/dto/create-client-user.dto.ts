import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@generated/prisma/client';
import { IsEmail, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateClientUserDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Alice', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Plaintext password; will be hashed server-side',
    example: 'Str0ngP@ssword!',
  })
  @IsString()
  @Length(8, 128)
  password: string;

  @ApiProperty({
    description: 'Client association is required for client users',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
    required: true,
  })
  @IsUUID()
  clientId: string;

  @ApiProperty({
    enum: Role,
    default: Role.USER,
    required: false,
    description: 'Admin cannot be created via API; use USER only.',
  })
  @IsOptional()
  role: Role;
}
