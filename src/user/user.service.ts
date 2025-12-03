import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { v7 as uuidv7 } from 'uuid';
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
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: {
        username: createUserDto.username,
      },
      withDeleted: true,
    });

    if (existingUser) {
      throw new ConflictException('Username sudah digunakan');
    }

    // 3. Hashing Password
    const password = createUserDto.password;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Buat Instance User
    const newUser = this.userRepository.create({
      id: uuidv7(),
      username: createUserDto.username,
      password: hashedPassword,
    });

    // 5. Simpan ke DB
    const savedUser = await this.userRepository.save(newUser);

    // 6. Logging
    this.logger.info('Success create a new user', {
      context: 'UserService',
      user_id: savedUser.id,
      username: savedUser.username,
    });

    return savedUser;
  }

  async findAll() {
    const user = await this.userRepository.find({
      withDeleted: true,
      select: {
        id: true,
        username: true,
        date_created: true,
        date_modified: true,
      },
    });
    return user;
  }

  findOne(id: string) {
    return `This action returns a #${id} user`;
  }

  findByUsername(username: string) {
    return this.userRepository.findOneBy({ username: username });
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
