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
  it('Firebase未設定時にランディングページが表示される', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // ランディングページの表示を確認
    expect(screen.getAllByText(/Futakake/)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/二人の家計管理/)[0]).toBeInTheDocument()
  })

  it('主な機能リストが表示される', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // 機能リストの確認（実際のランディングページの要素を確認）
    expect(screen.getAllByText(/Futakake/)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/無料で始める/)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/デモを試す/)[0]).toBeInTheDocument()
  })
})