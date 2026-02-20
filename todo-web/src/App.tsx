import { useState, useEffect, useRef } from 'react';
import type { Todo } from './types/todo';
import { getToken, removeToken } from './utils/api';
import { todosApi, type TodoChange } from './utils/api';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';
import { LoginModal } from './components/LoginModal';

type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const lastSyncTime = useRef<number>(0);

  // M3-WEB-04 同步触发时机：启动时、登录成功时
  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsLoggedIn(true);
      fetchTodos();
      // 启动时触发同步
      syncTodos();
    } else {
      setLoading(false);
    }
  }, []);

  // M3-WEB-04 同步触发时机：网络恢复时
  useEffect(() => {
    const handleOnline = () => {
      if (isLoggedIn) {
        syncTodos();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isLoggedIn]);

  // M5 同步增强：窗口重新获得焦点/从后台切回时触发同步
  useEffect(() => {
    if (!isLoggedIn) return;
    const handleFocus = () => syncTodos();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncTodos();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn]);

  // M5 同步增强：登录态下每 10 秒轮询同步一次
  useEffect(() => {
    if (!isLoggedIn) return;
    const timer = window.setInterval(() => {
      syncTodos();
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [isLoggedIn]);

  // M3-WEB-01 本地优先 + 后台同步
  const syncTodos = async () => {
    if (!isLoggedIn) return;
    
    setSyncStatus('syncing');
    try {
      const result = await todosApi.sync(lastSyncTime.current);
      if (result.data && result.data.length > 0) {
        applyChanges(result.data);
        lastSyncTime.current = Date.now();
      }
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  };

  // M3-WEB-01 应用增量变更到本地
  const applyChanges = (changes: TodoChange[]) => {
    setTodos(prev => {
      const map = new Map(prev.map(t => [t.id, t]));
      for (const change of changes) {
        if (change._action === 'create' || change._action === 'update') {
          map.set(change.id, {
            id: change.id,
            title: change.title,
            completed: change.completed,
            priority: change.priority,
            createdAt: new Date(change.createdAt).getTime(),
            updatedAt: new Date(change.updatedAt).getTime(),
          });
        } else if (change._action === 'delete') {
          map.delete(change.id);
        }
      }
      return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
    });
  };

  const fetchTodos = async () => {
    setLoading(true);
    const result = await todosApi.findAll();
    if (result.data) {
      setTodos(result.data.map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        priority: t.priority,
        createdAt: new Date(t.createdAt).getTime(),
        updatedAt: new Date(t.updatedAt).getTime(),
      })));
      // 记录同步时间
      lastSyncTime.current = Date.now();
    }
    setLoading(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
    fetchTodos();
    // M3-WEB-03 登录后触发同步
    syncTodos();
  };

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setTodos([]);
  };

  const handleAdd = async (title: string, priority: number) => {
    const result = await todosApi.create(title, priority);
    if (result.data) {
      const newTodo: Todo = {
        ...result.data,
        createdAt: new Date(result.data.createdAt).getTime(),
        updatedAt: new Date(result.data.updatedAt).getTime(),
      };
      setTodos([newTodo, ...todos]);
      syncTodos();
    }
  };

  const handleToggle = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const result = await todosApi.update(id, { completed: !todo.completed });
    if (result.data) {
      setTodos(todos.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ));
      syncTodos();
    }
  };

  const handleEdit = async (id: string, newTitle: string) => {
    const result = await todosApi.update(id, { title: newTitle });
    if (result.data) {
      setTodos(todos.map(t =>
        t.id === id ? { ...t, title: newTitle } : t
      ));
      syncTodos();
    }
  };

  const handlePriorityChange = async (id: string, priority: number) => {
    const result = await todosApi.update(id, { priority });
    if (result.data) {
      setTodos(todos.map(t =>
        t.id === id ? { ...t, priority } : t
      ));
      syncTodos();
    }
  };

  const handleDelete = async (id: string) => {
    const result = await todosApi.delete(id);
    if (result.data) {
      setTodos(todos.filter(t => t.id !== id));
      syncTodos();
    }
  };

  const handleClearCompleted = async () => {
    const completed = todos.filter(t => t.completed);
    await Promise.all(completed.map(t => todosApi.delete(t.id)));
    setTodos(todos.filter(t => !t.completed));
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">
          <span className="title-icon">✓</span>
          待办事项
        </h1>
        <p className="subtitle">专注当下，高效完成任务</p>
        <div className="header-actions">
          {isLoggedIn ? (
            <button className="logout-btn" onClick={handleLogout}>
              退出登录
            </button>
          ) : (
            <button className="login-btn" onClick={() => setShowLogin(true)}>
              登录 / 注册
            </button>
          )}
        </div>
      </header>

      <main className="main">
        <div className="card">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : isLoggedIn ? (
            <>
              <TodoInput onAdd={handleAdd} />
              <TodoList
                todos={todos}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPriorityChange={handlePriorityChange}
                onClearCompleted={handleClearCompleted}
              />
            </>
          ) : (
            <div className="not-logged-in">
              <p>请登录后使用待办事项功能</p>
              <button className="login-btn" onClick={() => setShowLogin(true)}>
                立即登录
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>{isLoggedIn ? '数据云端同步，多设备共享' : '数据保存在云端，登录后使用'}</p>
        {isLoggedIn && (
          <p className="sync-status">
            {syncStatus === 'synced' && '✓ 已同步'}
            {syncStatus === 'syncing' && '⟳ 同步中...'}
            {syncStatus === 'error' && '✗ 同步失败'}
            {syncStatus === 'offline' && '○ 离线'}
          </p>
        )}
      </footer>

      {showLogin && (
        <LoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
}

export default App;
