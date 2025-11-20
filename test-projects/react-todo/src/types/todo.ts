/**
 * Todo item interface
 * Represents a single todo item in the application
 */
export interface Todo {
  /** Unique identifier for the todo */
  id: string
  
  /** The todo title/description */
  title: string
  
  /** Whether the todo is completed */
  completed: boolean
  
  /** Creation timestamp */
  createdAt: Date
  
  /** Last update timestamp */
  updatedAt?: Date
}

/**
 * Filter options for todo list
 */
export type TodoFilter = 'all' | 'active' | 'completed'

/**
 * Todo statistics interface
 */
export interface TodoStats {
  /** Total number of todos */
  total: number
  
  /** Number of completed todos */
  completed: number
  
  /** Number of active (incomplete) todos */
  active: number
}

