const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const TOKEN_KEY = 'todo-app-token';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        removeToken();
        window.location.reload();
      }
      // 兼容后端新的 { data, error } 格式
      const errorMsg = data.error?.message || data.message || '请求失败';
      return { error: errorMsg };
    }

    // 兼容后端直接返回数据或 { data } 包装格式
    return { data: data.data !== undefined ? data.data : data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : '网络错误' };
  }
}

// 认证 API
export const authApi = {
  register: (email: string, password: string, name?: string) =>
    request<{ access_token: string; userId: string; email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<{ access_token: string; userId: string; email: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  resetPassword: (email: string, code: string, password: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, password }),
    }),
};

// 待办 API
export const todosApi = {
  findAll: () => request<TodoResponse[]>('/todos'),

  // 增量同步接口（M3-WEB-01）
  sync: (since?: number) => {
    const sinceStr = since ? new Date(since).toISOString() : undefined;
    return request<TodoChange[]>('/todos/sync' + (sinceStr ? `?since=${sinceStr}` : ''));
  },

  create: (title: string, priority: number = 3) =>
    request<TodoResponse>('/todos', {
      method: 'POST',
      body: JSON.stringify({ title, priority }),
    }),

  update: (id: string, data: Partial<{ title: string; completed: boolean; priority: number }>) =>
    request<TodoResponse>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/todos/${id}`, { method: 'DELETE' }),
};

export interface TodoResponse {
  id: string;
  title: string;
  completed: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface TodoChange extends TodoResponse {
  _action: 'create' | 'update' | 'delete';
}
