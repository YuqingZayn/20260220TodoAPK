import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface TodoChange {
  id: string;
  title: string;
  completed: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  userId: string;
  _action: 'create' | 'update' | 'delete';
}

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.todo.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getChanges(userId: string, since: Date): Promise<TodoChange[]> {
    const todos = await this.prisma.todo.findMany({
      where: { userId },
      orderBy: { updatedAt: 'asc' },
    });

    const changes: TodoChange[] = [];
    const sinceTime = since.getTime();

    for (const todo of todos) {
      const createdTime = new Date(todo.createdAt).getTime();
      const updatedTime = new Date(todo.updatedAt).getTime();
      const deletedTime = todo.deletedAt ? new Date(todo.deletedAt).getTime() : null;

      // 新增：创建时间在 since 之后且未删除
      if (createdTime >= sinceTime && !todo.deletedAt) {
        changes.push({ ...todo, _action: 'create' });
      }
      // 更新：更新时间在 since 之后且未删除
      else if (updatedTime >= sinceTime && createdTime < sinceTime && !todo.deletedAt) {
        changes.push({ ...todo, _action: 'update' });
      }
      // 删除：删除时间在 since 之后
      else if (deletedTime && deletedTime >= sinceTime) {
        changes.push({ ...todo, _action: 'delete' });
      }
    }

    return changes;
  }

  async create(userId: string, title: string, priority: number = 3) {
    return this.prisma.todo.create({
      data: { title, priority, userId },
    });
  }

  async update(userId: string, id: string, data: { title?: string; completed?: boolean; priority?: number }) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!todo) {
      throw new NotFoundException('待办不存在');
    }

    // LWW 策略：每次更新都更新 updatedAt，后更新的覆盖之前的
    return this.prisma.todo.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async delete(userId: string, id: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!todo) {
      throw new NotFoundException('待办不存在');
    }

    await this.prisma.todo.update({
      where: { id },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
    return { success: true };
  }
}
