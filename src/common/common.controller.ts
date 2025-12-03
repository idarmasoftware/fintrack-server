import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CommonService } from './common.service';
import { FileInterceptor } from '@nestjs/platform-express';

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

  @Get('debug-slack')
  testSlackError() {
    throw new Error('Ini adalah simulasi error untuk mengetes notifikasi Slack!');
  }

  @Post('upload')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    return {
      file: file?.originalname,
    };
  }
}
