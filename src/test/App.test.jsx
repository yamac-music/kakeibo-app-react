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
    expect(screen.getByText(/家計簿アプリ（デモモード）/)).toBeInTheDocument()
    expect(screen.getByText(/Firebase設定が見つかりません/)).toBeInTheDocument()
  })

  it('主な機能リストが表示される', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // 機能リストの確認
    expect(screen.getByText(/支出の記録と管理/)).toBeInTheDocument()
    expect(screen.getByText(/カテゴリ別予算設定/)).toBeInTheDocument()
    expect(screen.getByText(/グラフによるデータ可視化/)).toBeInTheDocument()
  })
})