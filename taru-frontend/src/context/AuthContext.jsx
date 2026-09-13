import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { authAPI } from '../api/authAPI.jsx'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

const initialState = {
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_INIT_DONE':
      return { ...state, isLoading: false }

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        isLoading: false,
      }

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      }

    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }

    case 'SET_TOKEN':
      return {
        ...state,
        accessToken: action.payload,
      }

    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // On mount: try to restore session via refresh token (stored in httpOnly cookie)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await authAPI.refresh()
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: res.data.user,
            accessToken: res.data.accessToken,
          },
        })
      } catch {
        // No valid session — that's fine
        dispatch({ type: 'AUTH_INIT_DONE' })
      }
    }
    restoreSession()
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password })
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        user: res.data.user,
        accessToken: res.data.accessToken,
      },
    })
    toast.success(`Welcome back, ${res.data.user.name}!`)
    return res.data.user
  }, [])

  const register = useCallback(async (formData) => {
    const res = await authAPI.register(formData)
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        user: res.data.user,
        accessToken: res.data.accessToken,
      },
    })
    toast.success('Account created successfully!')
    return res.data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch {
      // ignore errors on logout
    } finally {
      dispatch({ type: 'LOGOUT' })
      toast.success('Logged out successfully.')
    }
  }, [])

  const updateUser = useCallback((updatedFields) => {
    dispatch({ type: 'UPDATE_USER', payload: updatedFields })
  }, [])

  const setAccessToken = useCallback((token) => {
    dispatch({ type: 'SET_TOKEN', payload: token })
  }, [])

  const value = {
    user: state.user,
    accessToken: state.accessToken,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    role: state.user?.role ?? null,
    login,
    register,
    logout,
    updateUser,
    setAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
