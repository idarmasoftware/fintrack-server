import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './entities/category.entity';
import { UserPayload } from '../auth/interfaces/user-payload.interface';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(user: UserPayload, createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      user_id: user.id, // Set pemilik kategori
    });

    return await this.categoryRepository.save(category);
  }

  async findAll(user: UserPayload) {
    return await this.categoryRepository.find({
      where: { user_id: user.id }, // Filter cuma punya user tsb
      order: { name: 'ASC' },
    });
  }
}
