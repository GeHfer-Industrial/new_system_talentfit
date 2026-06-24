import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas do painel' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent-resumes')
  @ApiOperation({ summary: 'Últimos 5 currículos classificados' })
  getRecentResumes() {
    return this.dashboardService.getRecentResumes();
  }
}
