import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  update(id: string) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return this.userRepository.softDelete(id);
  }

  restore(id: string) {
    return this.userRepository.restore(id);
  }
}
