import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

class ValidateTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('validate')
  @Public()
  @ApiOperation({ summary: 'Valida token Supabase e sincroniza usuário local' })
  async validate(@Body() body: ValidateTokenDto) {
    return this.authService.validateSupabaseToken(body.token);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna perfil do usuário autenticado' })
  async me(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getProfile(user.sub);
  }
}
