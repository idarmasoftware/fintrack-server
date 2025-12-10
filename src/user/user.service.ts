import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MailService } from '../common/mail/mail.service';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: {
        email: createUserDto.email,
      },
      withDeleted: true,
    });

    if (existingUser) {
      throw new ConflictException('Email sudah digunakan');
    }

    // 3. Hashing Password
    const password = createUserDto.password;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Buat Instance User
    const newUser = this.userRepository.create({
      full_name: createUserDto.full_name,
      email: createUserDto.email,
      password: hashedPassword,
      activation_token: uuidv7(),
      is_active: false,
    });

    // 5. Simpan ke DB
    const savedUser = await this.userRepository.save(newUser);

    // 6. Logging
    this.logger.info('Success create a new user', {
      context: 'UserService',
      user_id: savedUser.id,
      email: savedUser.email,
    });

    return savedUser;
  }

  async findAll() {
    const user = await this.userRepository.find({
      withDeleted: true,
      select: {
        id: true,
        full_name: true,
        email: true,
        date_created: true,
        date_modified: true,
      },
    });
    return user;
  }

  findOne(id: string) {
    return this.userRepository.findOneBy({ id });
  }

  findByEmail(email: string) {
    return this.userRepository.findOneBy({ email: email });
  }

  async activateUser(token: string) {
    const user = await this.userRepository.findOneBy({ activation_token: token });
    if (!user) {
      return false;
    }
    user.is_active = true;
    user.activation_token = null;
    await this.userRepository.save(user);
    return true;
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    await this.userRepository.update(userId, { refresh_token: refreshToken });
  }

  // Method to update user details
  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.userRepository.softDelete(id);
  }

  restore(id: string) {
    return this.userRepository.restore(id);
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');

    user.full_name = dto.full_name;
    return this.userRepository.save(user);
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'password', 'email', 'full_name'] // explicitly select password
    });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Password lama salah');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

    user.password = hashedPassword;
    await this.userRepository.save(user);

    return { message: 'Password berhasil diubah' };
  }

  async requestEmailChange(id: string, newEmail: string) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');

    // Check if new email is already taken
    const existing = await this.findByEmail(newEmail);
    if (existing) {
      throw new ConflictException('Email sudah digunakan oleh pengguna lain');
    }

    const token = uuidv7();
    user.new_email = newEmail;
    user.email_verification_token = token;

    await this.userRepository.save(user);
    await this.mailService.sendEmailChangeConfirmation(user, token);

    return { message: 'Link verifikasi perubahan email telah dikirim ke email baru Anda' };
  }

  async verifyEmailChange(token: string) {
    const user = await this.userRepository.findOneBy({ email_verification_token: token });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (!user.new_email) {
      throw new BadRequestException('No pending email change found');
    }

    // Check conflict again just in case
    const existing = await this.findByEmail(user.new_email);
    if (existing) {
      throw new ConflictException('Email baru sudah digunakan pengguna lain');
    }

    const oldEmail = user.email;
    user.email = user.new_email;
    user.new_email = null;
    user.email_verification_token = null;

    await this.userRepository.save(user);

    this.logger.info(`User ${user.id} changed email from ${oldEmail} to ${user.email}`);

    return { message: 'Email berhasil diubah' };
  }
}
