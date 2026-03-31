import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type UserPayload } from '../auth/interfaces/user-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @Post()
  create(@CurrentUser() user: UserPayload, @Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(user, createCategoryDto);
  }

  @Get()
  findAll(@CurrentUser() user: UserPayload) {
    return this.categoryService.findAll(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.categoryService.findOne(id, user); // id is string now
  }

  @Patch(':id')
  update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto, user);
  }

  @Delete(':id')
  remove(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.categoryService.remove(id, user);
  }


}
