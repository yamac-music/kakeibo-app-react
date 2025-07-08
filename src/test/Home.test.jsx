import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import Home from '../components/Home'

const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </MemoryRouter>
)

describe('Home', () => {
  it('支出検索機能が正しく表示される', () => {
    render(
      <TestWrapper>
        <Home isDemoMode={true} />
      </TestWrapper>
    )
    
    // 検索ボックスがあることを確認
    expect(screen.getByPlaceholderText('支出を検索...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /検索/ })).toBeInTheDocument()
  })

  it('支出検索機能が動作する', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <Home isDemoMode={true} />
      </TestWrapper>
    )
    
    // 検索ボックスに入力
    const searchInput = screen.getByPlaceholderText('支出を検索...')
    await user.type(searchInput, '食費')
    
    // 検索ボタンをクリック
    const searchButton = screen.getByRole('button', { name: /検索/ })
    await user.click(searchButton)
    
    // 検索結果が表示される（現在は実装されていないので失敗する）
    expect(screen.getByText('検索結果')).toBeInTheDocument()
  })

  it('検索結果をクリアできる', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <Home isDemoMode={true} />
      </TestWrapper>
    )
    
    // 検索を実行
    const searchInput = screen.getByPlaceholderText('支出を検索...')
    await user.type(searchInput, '食費')
    
    const searchButton = screen.getByRole('button', { name: /検索/ })
    await user.click(searchButton)
    
    // クリアボタンを押す
    const clearButton = screen.getByRole('button', { name: /クリア/ })
    await user.click(clearButton)
    
    // 検索結果がクリアされる
    expect(screen.queryByText('検索結果')).not.toBeInTheDocument()
  })

  it('予算設定モーダルで前月からコピーボタンが表示される', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <Home isDemoMode={true} />
      </TestWrapper>
    )
    
    // 予算設定ボタンをクリック
    const budgetButton = screen.getByRole('button', { name: /目標/ })
    await user.click(budgetButton)
    
    // 前月からコピーボタンが表示される（aria-labelで検索）
    expect(screen.getByRole('button', { name: /前月.*から予算をコピー/ })).toBeInTheDocument()
  })

  it('前月からコピーボタンが無効になっている（データなし）', async () => {
    const user = userEvent.setup()
    
    render(
      <TestWrapper>
        <Home isDemoMode={true} />
      </TestWrapper>
    )
    
    // 予算設定ボタンをクリック
    const budgetButton = screen.getByRole('button', { name: /目標/ })
    await user.click(budgetButton)
    
    // 前月からコピーボタンが無効状態で表示される
    const copyButton = screen.getByRole('button', { name: /前月.*から予算をコピー/ })
    expect(copyButton).toBeDisabled()
    expect(screen.getByText('(データなし)')).toBeInTheDocument()
  })
})