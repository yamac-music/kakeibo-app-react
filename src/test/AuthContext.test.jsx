import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from '../contexts/AuthContext.jsx'

// テスト用コンポーネント
const TestComponent = () => {
  const { currentUser, isFirebaseAvailable } = useAuth()
  
  return (
    <div>
      <div data-testid="user-status">
        {currentUser ? 'Authenticated' : 'Not authenticated'}
      </div>
      <div data-testid="firebase-status">
        {isFirebaseAvailable ? 'Firebase available' : 'Firebase not available'}
      </div>
    </div>
  )
}

describe('AuthContext', () => {
  it('Firebase未設定時の初期状態を正しく提供する', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('user-status')).toHaveTextContent('Not authenticated')
    expect(screen.getByTestId('firebase-status')).toHaveTextContent('Firebase not available')
  })
})