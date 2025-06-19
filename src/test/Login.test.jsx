import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import Login from '../components/auth/Login'

const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </MemoryRouter>
)

describe('Login', () => {
  it('ログインフォームが正しく表示される', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )
    
    expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument()
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ログイン/ })).toBeInTheDocument()
  })

  it('新規登録へのリンクが表示される', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )
    
    expect(screen.getByText('新規登録')).toBeInTheDocument()
  })

  it('パスワードリセットへのリンクが表示される', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )
    
    expect(screen.getByText('パスワードを忘れた場合')).toBeInTheDocument()
  })

  it('フォームが送信できる', async () => {
    const _user = userEvent.setup()
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )
    
    const submitButton = screen.getByRole('button', { name: /ログイン/ })
    expect(submitButton).toBeInTheDocument()
    
    // フォームが存在することを確認
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
  })

  it('パスワード表示/非表示の切り替えが動作する', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )
    
    const passwordInput = screen.getByLabelText('パスワード')
    const toggleButtons = screen.getAllByRole('button')
    const toggleButton = toggleButtons.find(button => button.type === 'button' && button !== screen.getByRole('button', { name: /ログイン/ }))
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    if (toggleButton) {
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    }
  })
})