import { render, screen, fireEvent } from '@testing-library/react'
import { TodoItem } from '../components/TodoItem'
import { Todo } from '../types/todo'

describe('TodoItem', () => {
  const mockTodo: Todo = {
    id: '1',
    title: 'Test Todo',
    completed: false,
    createdAt: new Date()
  }

  const mockHandlers = {
    onToggle: jest.fn(),
    onDelete: jest.fn(),
    onEdit: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders todo item correctly', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />)
    
    expect(screen.getByText('Test Todo')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('calls onToggle when checkbox is clicked', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />)
    
    fireEvent.click(screen.getByRole('checkbox'))
    
    expect(mockHandlers.onToggle).toHaveBeenCalledWith('1')
  })

  it('calls onDelete when delete button is clicked', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />)
    
    fireEvent.click(screen.getByText('Delete'))
    
    expect(mockHandlers.onDelete).toHaveBeenCalledWith('1')
  })

  it('enters edit mode on double click', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />)
    
    fireEvent.doubleClick(screen.getByText('Test Todo'))
    
    expect(screen.getByLabelText('Edit todo')).toBeInTheDocument()
  })

  it('saves edit on blur', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />)
    
    fireEvent.doubleClick(screen.getByText('Test Todo'))
    
    const input = screen.getByLabelText('Edit todo')
    fireEvent.change(input, { target: { value: 'Updated Todo' } })
    fireEvent.blur(input)
    
    expect(mockHandlers.onEdit).toHaveBeenCalledWith('1', 'Updated Todo')
  })
})

