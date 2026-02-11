import { useContext } from 'react';
import { AuthContext } from './authContextValue.js';

export function useAuth() {
  return useContext(AuthContext);
}
