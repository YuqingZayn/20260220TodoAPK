import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TodosService } from './todos.service';
import { CreateTodoDto, UpdateTodoDto } from './todos.dto';

@Controller('todos')
@UseGuards(AuthGuard('jwt'))
export class TodosController {
  constructor(private todos: TodosService) {}

  @Get()
  async findAll(@Request() req: { user: { userId: string } }) {
    return this.todos.findAll(req.user.userId);
  }

  @Get('sync')
  async sync(
    @Request() req: { user: { userId: string } },
    @Query('since') since?: string
  ) {
    const sinceDate = since ? new Date(since) : new Date(0);
    return this.todos.getChanges(req.user.userId, sinceDate);
  }

  @Post()
  async create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateTodoDto
  ) {
    return this.todos.create(req.user.userId, dto.title, dto.priority);
  }

  @Put(':id')
  async update(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto
  ) {
    return this.todos.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  async delete(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string
  ) {
    return this.todos.delete(req.user.userId, id);
  }
}
