import { TodosService } from './todos.service';
import { CreateTodoDto, UpdateTodoDto } from './todos.dto';
export declare class TodosController {
    private todos;
    constructor(todos: TodosService);
    findAll(req: {
        user: {
            userId: string;
        };
    }): Promise<{
        priority: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        completed: boolean;
        deletedAt: Date | null;
        userId: string;
    }[]>;
    sync(req: {
        user: {
            userId: string;
        };
    }, since?: string): Promise<import("./todos.service").TodoChange[]>;
    create(req: {
        user: {
            userId: string;
        };
    }, dto: CreateTodoDto): Promise<{
        priority: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        completed: boolean;
        deletedAt: Date | null;
        userId: string;
    }>;
    update(req: {
        user: {
            userId: string;
        };
    }, id: string, dto: UpdateTodoDto): Promise<{
        priority: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        completed: boolean;
        deletedAt: Date | null;
        userId: string;
    }>;
    delete(req: {
        user: {
            userId: string;
        };
    }, id: string): Promise<{
        success: boolean;
    }>;
}
