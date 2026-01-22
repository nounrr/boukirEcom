import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// Match backend user structure
export interface User {
  id: number;
  prenom: string;  // First name
  nom: string;     // Last name
  email: string;
  telephone: string | null;
  type_compte: string;  // "Client" | "Artisan/Promoteur"
  auth_provider?: string;
  email_verified?: boolean;
  avatar_url: string | null;
  locale: string;
  last_login_at?: string;
  created_at?: string;
  demande_artisan?: boolean;
  artisan_approuve?: boolean;
  // Remise balance (loyalty credit)
  remise_balance?: number;
  // Solde eligibility (Buy Now, Pay Later)
  is_solde?: boolean | number;
}

// Full auth state including tokens
interface UserState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: UserState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Set user with tokens (after login/register)
    setAuth: (state, action: PayloadAction<{
      user: User | null;
      accessToken: string;
      refreshToken: string | null;
    }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = !!action.payload.accessToken;
      state.isLoading = false;
    },

    // Update user info only
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isLoading = false;
    },

    // Update tokens (after refresh)
    setTokens: (state, action: PayloadAction<{
      accessToken: string;
      refreshToken?: string;
    }>) => {
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
    },

    // Clear all auth data (logout)
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setAuth, setUser, setTokens, clearAuth, setLoading } = userSlice.actions;

// Selectors
export const selectUser = (state: RootState) => state.user.user;
export const selectIsAuthenticated = (state: RootState) => state.user.isAuthenticated;
export const selectAccessToken = (state: RootState) => state.user.accessToken;
export const selectRefreshToken = (state: RootState) => state.user.refreshToken;
export const selectIsLoading = (state: RootState) => state.user.isLoading;
export const selectUserFullName = (state: RootState) =>
  state.user.user ? `${state.user.user.prenom} ${state.user.user.nom}` : null;
export const selectUserRole = (state: RootState) => state.user.user?.type_compte;

export default userSlice.reducer;
