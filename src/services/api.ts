import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://20260220todoapk-production.up.railway.app';
const TOKEN_KEY = 'todo-app-token';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: number;
  createdAt: number;
  updatedAt: number;
}

export interface TodoChange extends Todo {
  _action: 'create' | 'update' | 'delete';
}

export const authApi = {
  register: async (email: string, password: string, name?: string) => {
    const res = await axios.post(`${API_URL}/auth/register`, { email, password, name }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  },

  login: async (email: string, password: string) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  },

  sendCode: async (email: string) => {
    const res = await axios.post(`${API_URL}/auth/send-code`, { email }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  },

  resetPassword: async (email: string, code: string, password: string) => {
    const res = await axios.post(`${API_URL}/auth/reset-password`, { email, code, password }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  },
};

export const todosApi = {
  findAll: async (): Promise<Todo[]> => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const res = await axios.get(`${API_URL}/todos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data || res.data;
  },

  sync: async (since?: number): Promise<TodoChange[]> => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const url = since 
      ? `${API_URL}/todos/sync?since=${new Date(since).toISOString()}`
      : `${API_URL}/todos/sync`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data || res.data;
  },

  create: async (title: string, priority: number = 3): Promise<Todo> => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const res = await axios.post(`${API_URL}/todos`, { title, priority }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data || res.data;
  },

  update: async (id: string, data: { title?: string; completed?: boolean; priority?: number }): Promise<Todo> => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const res = await axios.put(`${API_URL}/todos/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data || res.data;
  },

  delete: async (id: string) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const res = await axios.delete(`${API_URL}/todos/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};

export const storage = {
  getToken: () => AsyncStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => AsyncStorage.setItem(TOKEN_KEY, token),
  removeToken: () => AsyncStorage.removeItem(TOKEN_KEY),
};
