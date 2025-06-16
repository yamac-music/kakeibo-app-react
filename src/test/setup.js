import '@testing-library/jest-dom'
import React from 'react'

// Firebaseモックの設定
vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  isFirebaseAvailable: false,
  appId: 'test-app-id'
}))

// React Router モック
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  const { MemoryRouter } = actual
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    BrowserRouter: ({ children }) => React.createElement(MemoryRouter, {}, children)
  }
})

// 環境変数の設定
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})