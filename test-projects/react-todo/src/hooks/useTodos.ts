import { useState, useEffect, useCallback } from 'react'
import { Todo, TodoFilter } from '../types/todo'

/**
 * Custom hook for managing todos
 * Handles CRUD operations and persistence
 * 
 * @returns Object with todos state and actions
 * 
 * @example
 * ```tsx
 * const { todos, addTodo, toggleTodo, deleteTodo } = useTodos()
 * ```
 */
export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<TodoFilter>('all')

  /**
   * Load todos from localStorage on mount
   */
  useEffect(() => {
    const stored = localStorage.getItem('todos')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setTodos(parsed.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined
        })))
      } catch (error) {
        console.error('Failed to load todos:', error)
      }
    }
  }, [])

  /**
   * Save todos to localStorage whenever they change
   */
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  /**
   * Add a new todo
   */
  const addTodo = useCallback((title: string) => {
    if (!title.trim()) return

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      createdAt: new Date()
    }

    setTodos(prev => [newTodo, ...prev])
  }, [])

  /**
   * Toggle todo completion status
   */
  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed, updatedAt: new Date() }
        : todo
    ))
  }, [])

  /**
   * Delete a todo
   */
  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id))
  }, [])

  /**
   * Edit todo title
   */
  const editTodo = useCallback((id: string, title: string) => {
    if (!title.trim()) return

    setTodos(prev => prev.map(todo =>
      todo.id === id
        ? { ...todo, title: title.trim(), updatedAt: new Date() }
        : todo
    ))
  }, [])

  /**
   * Clear all completed todos
   */
  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(todo => !todo.completed))
  }, [])

  return {
    todos,
    filter,
    setFilter,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    clearCompleted
  }
}

