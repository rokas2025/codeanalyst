import React from 'react'
import { Todo, TodoFilter } from '../types/todo'
import { TodoItem } from './TodoItem'

/**
 * Props for TodoList component
 */
interface TodoListProps {
  /** Array of todos to display */
  todos: Todo[]
  
  /** Current filter selection */
  filter: TodoFilter
  
  /** Callback when filter changes */
  onFilterChange: (filter: TodoFilter) => void
  
  /** Callback when todo is toggled */
  onToggle: (id: string) => void
  
  /** Callback when todo is deleted */
  onDelete: (id: string) => void
  
  /** Callback when todo is edited */
  onEdit: (id: string, title: string) => void
}

/**
 * TodoList Component
 * Displays a filterable list of todos
 * 
 * @example
 * ```tsx
 * <TodoList 
 *   todos={todos}
 *   filter="all"
 *   onFilterChange={setFilter}
 *   onToggle={handleToggle}
 *   onDelete={handleDelete}
 *   onEdit={handleEdit}
 * />
 * ```
 */
export const TodoList: React.FC<TodoListProps> = ({
  todos,
  filter,
  onFilterChange,
  onToggle,
  onDelete,
  onEdit
}) => {
  /**
   * Filter todos based on current filter
   */
  const filteredTodos = React.useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed)
      case 'completed':
        return todos.filter(todo => todo.completed)
      default:
        return todos
    }
  }, [todos, filter])

  return (
    <div className="todo-list">
      {/* Filter buttons */}
      <div className="filters" role="group" aria-label="Todo filters">
        <button
          onClick={() => onFilterChange('all')}
          className={filter === 'all' ? 'active' : ''}
          aria-pressed={filter === 'all'}
        >
          All ({todos.length})
        </button>
        <button
          onClick={() => onFilterChange('active')}
          className={filter === 'active' ? 'active' : ''}
          aria-pressed={filter === 'active'}
        >
          Active ({todos.filter(t => !t.completed).length})
        </button>
        <button
          onClick={() => onFilterChange('completed')}
          className={filter === 'completed' ? 'active' : ''}
          aria-pressed={filter === 'completed'}
        >
          Completed ({todos.filter(t => t.completed).length})
        </button>
      </div>

      {/* Todo items */}
      <div className="items">
        {filteredTodos.length === 0 ? (
          <p className="empty-state">No todos to show</p>
        ) : (
          filteredTodos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  )
}

