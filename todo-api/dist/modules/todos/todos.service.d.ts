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
export declare class TodosService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        priority: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        completed: boolean;
        deletedAt: Date | null;
        userId: string;
    }[]>;
    getChanges(userId: string, since: Date): Promise<TodoChange[]>;
    create(userId: string, title: string, priority?: number): Promise<{
        priority: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        completed: boolean;
        deletedAt: Date | null;
        userId: string;
    }>;
    update(userId: string, id: string, data: {
        title?: string;
        completed?: boolean;
        priority?: number;
    }): Promise<{
        priority: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        completed: boolean;
        deletedAt: Date | null;
        userId: string;
    }>;
    delete(userId: string, id: string): Promise<{
        success: boolean;
    }>;
}
