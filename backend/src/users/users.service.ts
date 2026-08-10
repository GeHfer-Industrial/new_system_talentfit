import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly supabaseAdmin: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') ?? '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
  }

  async findAll() {
    const [prismaUsers, { data: supabaseData }] = await Promise.all([
      this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
      this.supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseMap = new Map<string, any>(
      (supabaseData?.users ?? []).map((u: any) => [u.email, u]),
    );

    return prismaUsers.map((u) => {
      const su = supabaseMap.get(u.email);
      return {
        ...u,
        inviteAccepted: su ? !!su.email_confirmed_at : false,
        lastSignIn: su?.last_sign_in_at ?? null,
      };
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Usuário ${id} não encontrado`);
    return user;
  }

  async completeOnboarding(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { onboardingCompletedAt: new Date() },
    });
  }

  async create(dto: CreateUserDto) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'https://new-system-talentfit.vercel.app';
    const { error } = await this.supabaseAdmin.auth.admin.inviteUserByEmail(dto.email, {
      data: { full_name: dto.name },
      redirectTo: `${frontendUrl}/set-password`,
    });
    if (error) throw new BadRequestException(error.message);

    return this.prisma.user.upsert({
      where: { email: dto.email },
      update: { name: dto.name, role: dto.role ?? Role.RECRUITER },
      create: { name: dto.name, email: dto.email, role: dto.role ?? Role.RECRUITER },
    });
  }

  async resendInvite(id: string) {
    const user = await this.findOne(id);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'https://new-system-talentfit.vercel.app';
    const { error } = await this.supabaseAdmin.auth.admin.inviteUserByEmail(user.email, {
      data: { full_name: user.name },
      redirectTo: `${frontendUrl}/set-password`,
    });
    if (error) throw new BadRequestException(error.message);
    return { message: 'Convite reenviado com sucesso' };
  }

  async resetPassword(id: string) {
    const user = await this.findOne(id);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'https://new-system-talentfit.vercel.app';
    const { error } = await this.supabaseAdmin.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${frontendUrl}/set-password`,
    });
    if (error) throw new BadRequestException(error.message);
    return { message: 'E-mail de redefinição de senha enviado' };
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    const { data } = await this.supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const supabaseUser = (data?.users ?? []).find((u: any) => u.email === user.email);
    if (supabaseUser) {
      await this.supabaseAdmin.auth.admin.deleteUser(supabaseUser.id);
    }

    return this.prisma.user.delete({ where: { id } });
  }
}
