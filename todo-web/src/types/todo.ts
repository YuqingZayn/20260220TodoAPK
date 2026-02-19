export interface Todo {
  id: string;            // UUID
  title: string;
  completed: boolean;
  priority: number;      // 1-4: 紧急/高/中/低
  createdAt: number;     // 毫秒时间戳
  updatedAt: number;     // 毫秒时间戳
  deletedAt?: number;    // 软删除（M1 可先不实现）
}
