import { renderHook, act } from '@testing-library/react'
import { useTodos } from '../hooks/useTodos'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useTodos hook', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('initializes with empty todos', () => {
    const { result } = renderHook(() => useTodos())
    
    expect(result.current.todos).toEqual([])
    expect(result.current.filter).toBe('all')
  })

  it('adds a new todo', () => {
    const { result } = renderHook(() => useTodos())
    
    act(() => {
      result.current.addTodo('New Todo')
    })
    
    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].title).toBe('New Todo')
    expect(result.current.todos[0].completed).toBe(false)
  })

  it('toggles todo completion', () => {
    const { result } = renderHook(() => useTodos())
    
    act(() => {
      result.current.addTodo('Test Todo')
    })
    
    const todoId = result.current.todos[0].id
    
    act(() => {
      result.current.toggleTodo(todoId)
    })
    
    expect(result.current.todos[0].completed).toBe(true)
  })

  it('deletes a todo', () => {
    const { result } = renderHook(() => useTodos())
    
    act(() => {
      result.current.addTodo('Todo to delete')
    })
    
    const todoId = result.current.todos[0].id
    
    act(() => {
      result.current.deleteTodo(todoId)
    })
    
    expect(result.current.todos).toHaveLength(0)
  })

  it('edits todo title', () => {
    const { result } = renderHook(() => useTodos())
    
    act(() => {
      result.current.addTodo('Original Title')
    })
    
    const todoId = result.current.todos[0].id
    
    act(() => {
      result.current.editTodo(todoId, 'Updated Title')
    })
    
    expect(result.current.todos[0].title).toBe('Updated Title')
  })

  it('clears completed todos', () => {
    const { result } = renderHook(() => useTodos())
    
    act(() => {
      result.current.addTodo('Todo 1')
      result.current.addTodo('Todo 2')
    })
    
    act(() => {
      result.current.toggleTodo(result.current.todos[0].id)
    })
    
    act(() => {
      result.current.clearCompleted()
    })
    
    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].title).toBe('Todo 2')
  })

  it('persists todos to localStorage', () => {
    const { result } = renderHook(() => useTodos())
    
    act(() => {
      result.current.addTodo('Persisted Todo')
    })
    
    const stored = localStorageMock.getItem('todos')
    expect(stored).toBeTruthy()
    
    const parsed = JSON.parse(stored!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].title).toBe('Persisted Todo')
  })
})

