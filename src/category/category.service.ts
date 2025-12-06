import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { UserPayload } from '../auth/interfaces/user-payload.interface';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) { }

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

  async findOne(id: string, user: UserPayload) {
    return await this.categoryRepository.findOne({
      where: { id, user_id: user.id },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, user: UserPayload) {
    const category = await this.findOne(id, user);
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    // Merge updates
    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async remove(id: string, user: UserPayload) {
    const category = await this.findOne(id, user);
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    // Hard delete or Soft delete? Using soft delete usually better but check entity
    // Assuming standard delete for now unless entity has deletedAt
    return await this.categoryRepository.remove(category);
  }
}
