import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@generated/prisma/client';
import { UsersService } from './user.service';
import { CreateClientUserDto } from './dto/create-client-user.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiBody({ type: CreateClientUserDto })
  @ApiCreatedResponse({
    description: 'User created',
    type: CreateClientUserDto,
  })
  createClientUser(
    @Body() data: CreateClientUserDto,
  ): Promise<Omit<User, 'hashedPassword'>> {
    return this.usersService.createClientUser(data);
  }
}
