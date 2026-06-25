import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Retorna o usuário autenticado' })
  findMe(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.findOne(user.sub);
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ApiOperation({ summary: 'Lista todos os usuários' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ApiOperation({ summary: 'Busca usuário por ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ApiOperation({ summary: 'Cria usuário e envia convite por e-mail' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Post(':id/resend-invite')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ApiOperation({ summary: 'Reenvia convite por e-mail' })
  resendInvite(@Param('id') id: string) {
    return this.usersService.resendInvite(id);
  }

  @Post(':id/reset-password')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Envia e-mail de redefinição de senha para o usuário' })
  resetPassword(@Param('id') id: string) {
    return this.usersService.resetPassword(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remove usuário' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
