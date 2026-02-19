import { useState } from 'react';
import type { Todo } from '../types/todo';
import { formatTime, PRIORITY_LABELS } from '../utils/helpers';

interface Props {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newTitle: string) => void;
  onPriorityChange: (id: string, priority: number) => void;
}

export const TodoItem = ({ todo, onToggle, onDelete, onEdit, onPriorityChange }: Props) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);

  const priority = todo.priority >= 1 && todo.priority <= 4 ? todo.priority : 3;

  const handleSave = () => {
    if (title.trim() && title.trim() !== todo.title) {
      onEdit(todo.id, title.trim());
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setTitle(todo.title);
    setEditing(false);
  };

  const handlePriorityClick = () => {
    const next = todo.priority >= 4 ? 1 : todo.priority + 1;
    onPriorityChange(todo.id, next);
  };

  return (
    <li className={`todo-item priority-${priority} ${todo.completed ? 'completed' : ''}`}>
      <button
        type="button"
        className={`todo-priority-badge priority-${priority}`}
        onClick={handlePriorityClick}
        title={`${priority} 级 - ${PRIORITY_LABELS[priority]}`}
        aria-label={`优先级 ${priority}，点击切换`}
      >
        {priority}
      </button>
      <input
        type="checkbox"
        className="todo-checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={todo.completed ? '标记为未完成' : '标记为已完成'}
      />
      <div className="todo-content">
        {editing ? (
          <input
            type="text"
            className="todo-input-edit"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
              }
            }}
            maxLength={200}
            autoFocus
          />
        ) : (
          <>
            <span className="todo-title" onClick={() => setEditing(true)}>
              {todo.title}
            </span>
            <div className="todo-meta">
              {todo.updatedAt !== todo.createdAt ? '更新于 ' : '创建于 '}
              {formatTime(todo.updatedAt !== todo.createdAt ? todo.updatedAt : todo.createdAt)}
            </div>
          </>
        )}
      </div>
      <button
        type="button"
        className="todo-delete"
        onClick={() => onDelete(todo.id)}
        aria-label="删除"
      >
        ×
      </button>
    </li>
  );
};
