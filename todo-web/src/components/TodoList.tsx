import { useState } from 'react';
import type { Todo } from '../types/todo';
import { TodoItem } from './TodoItem';

interface Props {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newTitle: string) => void;
  onPriorityChange: (id: string, priority: number) => void;
  onClearCompleted: () => void;
}

export const TodoList = ({ todos, onToggle, onDelete, onEdit, onPriorityChange, onClearCompleted }: Props) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const getFilteredTodos = () => {
    let list = [...todos];

    if (filter === 'active') {
      list = list.filter(t => !t.completed);
    } else if (filter === 'completed') {
      list = list.filter(t => t.completed);
    }

    list.sort((a, b) =>
      sortOrder === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );

    return list;
  };

  const filteredTodos = getFilteredTodos();
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;

  return (
    <>
      <div className="toolbar">
        <div className="filter-group">
          {(['all', 'active', 'completed'] as const).map(f => (
            <button
              key={f}
              type="button"
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '全部' : f === 'active' ? '未完成' : '已完成'}
            </button>
          ))}
        </div>
        <select
          className="sort-select"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
        >
          <option value="newest">最新优先</option>
          <option value="oldest">最早优先</option>
        </select>
      </div>

      <ul className="todo-list">
        {filteredTodos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            onPriorityChange={onPriorityChange}
          />
        ))}
      </ul>

      {filteredTodos.length === 0 && (
        <div className="empty-state visible">
          <div className="empty-icon">📋</div>
          <p className="empty-text">暂无待办，添加一个开始吧</p>
          <p className="empty-hint">点击上方输入框或按 Enter 快速添加</p>
        </div>
      )}

      <footer className="footer">
        <span className="stats">共 {total} 项，已完成 {completed} 项</span>
        {completed > 0 && (
          <button type="button" className="clear-btn" onClick={onClearCompleted}>
            清空已完成
          </button>
        )}
      </footer>
    </>
  );
};
