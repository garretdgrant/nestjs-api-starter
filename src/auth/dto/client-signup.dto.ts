import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ClientSignupDto {
  @ApiProperty({
    description: 'Contact person name',
    example: 'Alice Doe',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  contactName!: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Acme Co',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  companyName!: string;

  @ApiProperty({
    description: 'Login email (will be lowercased)',
    example: 'alice@example.com',
  })
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    description: 'Password (8-72 chars)',
    example: 'supersecret',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({
    description: 'Initial project name',
    example: 'Website',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  projectName!: string;
}
