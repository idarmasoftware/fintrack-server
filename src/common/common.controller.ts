import { Controller, Get } from '@nestjs/common';
import { CommonService } from './common.service';

@Controller()
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Get()
  getMessage(): Record<string, string> {
    return this.commonService.getMessage();
  }

  @Get('uuid')
  getUuid(): Record<string, string> {
    return this.commonService.getUuid();
  }
}
