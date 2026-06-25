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

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }
}
