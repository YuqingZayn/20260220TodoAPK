"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
let TodosService = class TodosService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        return this.prisma.todo.findMany({
            where: { userId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getChanges(userId, since) {
        const todos = await this.prisma.todo.findMany({
            where: { userId },
            orderBy: { updatedAt: 'asc' },
        });
        const changes = [];
        const sinceTime = since.getTime();
        for (const todo of todos) {
            const createdTime = new Date(todo.createdAt).getTime();
            const updatedTime = new Date(todo.updatedAt).getTime();
            const deletedTime = todo.deletedAt ? new Date(todo.deletedAt).getTime() : null;
            if (createdTime >= sinceTime && !todo.deletedAt) {
                changes.push({ ...todo, _action: 'create' });
            }
            else if (updatedTime >= sinceTime && createdTime < sinceTime && !todo.deletedAt) {
                changes.push({ ...todo, _action: 'update' });
            }
            else if (deletedTime && deletedTime >= sinceTime) {
                changes.push({ ...todo, _action: 'delete' });
            }
        }
        return changes;
    }
    async create(userId, title, priority = 3) {
        return this.prisma.todo.create({
            data: { title, priority, userId },
        });
    }
    async update(userId, id, data) {
        const todo = await this.prisma.todo.findFirst({
            where: { id, userId, deletedAt: null },
        });
        if (!todo) {
            throw new common_1.NotFoundException('待办不存在');
        }
        return this.prisma.todo.update({
            where: { id },
            data: { ...data, updatedAt: new Date() },
        });
    }
    async delete(userId, id) {
        const todo = await this.prisma.todo.findFirst({
            where: { id, userId, deletedAt: null },
        });
        if (!todo) {
            throw new common_1.NotFoundException('待办不存在');
        }
        await this.prisma.todo.update({
            where: { id },
            data: { deletedAt: new Date(), updatedAt: new Date() },
        });
        return { success: true };
    }
};
exports.TodosService = TodosService;
exports.TodosService = TodosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TodosService);
//# sourceMappingURL=todos.service.js.map