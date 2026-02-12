import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext.jsx';
import Home from '../components/Home';

const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </MemoryRouter>
);

describe('Home', () => {
  it('即時検索UIが表示される', () => {
    render(
      <TestWrapper>
        <Home isDemoMode={true} />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('支出を検索...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /クリア/ })).toBeInTheDocument();
  });

  it('検索入力を即時更新できる', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <Home isDemoMode={true} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('支出を検索...');
    await user.type(searchInput, '食費');

    expect(searchInput).toHaveValue('食費');
  });

  it('検索入力をクリアできる', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <Home isDemoMode={true} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('支出を検索...');
    await user.type(searchInput, '食費');

    const clearButton = screen.getByRole('button', { name: /クリア/ });
    await user.click(clearButton);

    expect(searchInput).toHaveValue('');
  });

  it('予算設定モーダルで前月からコピーボタンが表示される', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <Home isDemoMode={true} />
      </TestWrapper>
    );

    const budgetButton = screen.getByRole('button', { name: /目標/ });
    await user.click(budgetButton);

    expect(screen.getByRole('button', { name: /前月.*から予算をコピー/ })).toBeInTheDocument();
  });
});

