import React from 'react'
import { Todo } from '../types/todo'

/**
 * Props for TodoItem component
 */
interface TodoItemProps {
  /** The todo item to display */
  todo: Todo
  
  /** Callback when todo is toggled */
  onToggle: (id: string) => void
  
  /** Callback when todo is deleted */
  onDelete: (id: string) => void
  
  /** Callback when todo is edited */
  onEdit: (id: string, title: string) => void
}

/**
 * TodoItem Component
 * Displays a single todo item with actions
 * 
 * @example
 * ```tsx
 * <TodoItem 
 *   todo={myTodo}
 *   onToggle={handleToggle}
 *   onDelete={handleDelete}
 *   onEdit={handleEdit}
 * />
 * ```
 */
export const TodoItem: React.FC<TodoItemProps> = ({ 
  todo, 
  onToggle, 
  onDelete, 
  onEdit 
}) => {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(todo.title)

  /**
   * Handle edit submission
   */
  const handleSubmitEdit = () => {
    if (editValue.trim()) {
      onEdit(todo.id, editValue.trim())
      setIsEditing(false)
    }
  }

  /**
   * Handle escape key to cancel editing
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditValue(todo.title)
      setIsEditing(false)
    } else if (e.key === 'Enter') {
      handleSubmitEdit()
    }
  }

  return (
    <div className="todo-item" data-testid={`todo-${todo.id}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSubmitEdit}
          onKeyDown={handleKeyDown}
          autoFocus
          aria-label="Edit todo"
        />
      ) : (
        <span 
          className={todo.completed ? 'completed' : ''}
          onDoubleClick={() => setIsEditing(true)}
        >
          {todo.title}
        </span>
      )}
      
      <button 
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete "${todo.title}"`}
      >
        Delete
      </button>
    </div>
  )
}

