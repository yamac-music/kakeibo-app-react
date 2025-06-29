import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import App from '../App'

// テスト用のラッパーコンポーネント
const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </MemoryRouter>
)

describe('App', () => {
  it('Firebase未設定時にホームコンポーネントが表示される', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // デモモードの表示を確認
    expect(screen.getByText(/二人暮らしの家計簿/)).toBeInTheDocument()
    expect(screen.getByText(/ゲストユーザー/)).toBeInTheDocument()
  })

  it('主な機能リストが表示される', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // 機能リストの確認（実際のホームコンポーネントの要素を確認）
    expect(screen.getByText(/二人暮らしの家計簿/)).toBeInTheDocument()
    expect(screen.getByText(/目標/)).toBeInTheDocument()
    expect(screen.getAllByText(/設定/)[0]).toBeInTheDocument()
  })
})