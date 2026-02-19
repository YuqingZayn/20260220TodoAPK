import { useState } from 'react';

interface Props {
  onAdd: (title: string, priority: number) => void;
}

export const TodoInput = ({ onAdd }: Props) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), priority);
    setTitle('');
  };

  return (
    <div className="add-todo">
      <form onSubmit={handleSubmit} className="add-todo-row">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="添加新待办，按 Enter 确认"
          className="todo-input"
          maxLength={200}
        />
        <button type="submit" className="add-btn">
          <span className="add-icon">+</span>
        </button>
      </form>
      <div className="priority-selector">
        <span className="priority-label">优先级：</span>
        {[1, 2, 3, 4].map(p => (
          <button
            key={p}
            type="button"
            className={`priority-btn ${priority === p ? 'active' : ''}`}
            data-priority={p}
            onClick={() => setPriority(p)}
            title={`${p} 级 - ${p === 1 ? '紧急' : p === 2 ? '高' : p === 3 ? '中' : '低'}`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};
