import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPayload } from '../auth/interfaces/user-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('report')
export class ReportController {
    constructor(private readonly reportService: ReportService) { }

    @Get('dashboard')
    getDashboardSummary(@CurrentUser() user: UserPayload) {
        return this.reportService.getDashboardSummary(user);
    }

    @Get('spending-by-category')
    getSpendingByCategory(@CurrentUser() user: UserPayload) {
        return this.reportService.getSpendingByCategory(user);
    }
}
