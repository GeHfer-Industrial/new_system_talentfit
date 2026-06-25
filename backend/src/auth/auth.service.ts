import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL') ?? '',
      this.configService.get<string>('SUPABASE_ANON_KEY') ?? '',
    );
  }

  async validateSupabaseToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Token Supabase inválido');
    }

    const supabaseUser = data.user;

    const user = await this.prisma.user.upsert({
      where: { email: supabaseUser.email ?? '' },
      update: {},
      create: {
        email: supabaseUser.email ?? '',
        name:
          supabaseUser.user_metadata?.['full_name'] ??
          supabaseUser.email?.split('@')[0] ??
          'Usuário',
        role: Role.RECRUITER,
      },
    });

    return { user, accessToken: token };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
