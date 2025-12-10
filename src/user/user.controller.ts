import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPayload } from '../auth/interfaces/user-payload.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@CurrentUser() user: UserPayload, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  async changePassword(@CurrentUser() user: UserPayload, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('email/request')
  async requestEmailChange(@CurrentUser() user: UserPayload, @Body() dto: RequestEmailChangeDto) {
    return this.userService.requestEmailChange(user.id, dto.newEmail);
  }

  @Get('email/verify')
  async verifyEmailChange(@Query('token') token: string) {
    return this.userService.verifyEmailChange(token);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const newuser = await this.userService.create(createUserDto);
    return {
      message: 'registrasi berhasil',
      data: {
        user_id: newuser.id,
        full_name: newuser.full_name,
        email: newuser.email,
      },
    };
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Patch(':id')
  restore(@Param('id') id: string) {
    return this.userService.restore(id);
  }
}
