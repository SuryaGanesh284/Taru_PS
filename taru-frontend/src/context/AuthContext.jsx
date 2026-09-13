import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { authAPI } from '../api/authAPI.jsx'
import { injectAuthHelpers } from '../api/axiosInstance.jsx'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

const normalizeUser = (user) => {
  if (!user) return null
  return {
    ...user,
    role: (user.role || 'buyer').toLowerCase(),
  }
}

const initialState = {
  user: null,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('taru_access_token') : null,
  isLoading: true,
  isAuthenticated: false,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_INIT_DONE':
      return { ...state, isLoading: false }

    case 'LOGIN_SUCCESS': {
      const user = normalizeUser(action.payload.user)
      const accessToken = action.payload.accessToken
      if (accessToken) {
        localStorage.setItem('taru_access_token', accessToken)
      }
      return {
        ...state,
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      }
    }

    case 'LOGOUT':
      localStorage.removeItem('taru_access_token')
      return {
        ...initialState,
        accessToken: null,
        isLoading: false,
      }

    case 'UPDATE_USER':
      return {
        ...state,
        user: normalizeUser({ ...state.user, ...action.payload }),
      }

    case 'SET_TOKEN':
      if (action.payload) {
        localStorage.setItem('taru_access_token', action.payload)
      }
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

  // Inject helpers into axiosInstance so interceptors can attach / refresh token
  useEffect(() => {
    injectAuthHelpers(
      (token) => dispatch({ type: 'SET_TOKEN', payload: token }),
      () => state.accessToken || localStorage.getItem('taru_access_token')
    )
  }, [state.accessToken])

  // On mount: try to restore session via refresh token or getMe if token exists
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await authAPI.refresh()
        const user = res.data?.user || res.data?.data?.user
        const accessToken = res.data?.accessToken || res.data?.data?.accessToken
        if (user && accessToken) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, accessToken },
          })
          return
        }
      } catch {
        // Refresh cookie not valid; check if token exists in localStorage
        const storedToken = localStorage.getItem('taru_access_token')
        if (storedToken) {
          try {
            const meRes = await authAPI.getMe()
            const user = meRes.data?.user || meRes.data?.data?.user
            if (user) {
              dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user, accessToken: storedToken },
              })
              return
            }
          } catch {
            localStorage.removeItem('taru_access_token')
          }
        }
      }
      dispatch({ type: 'AUTH_INIT_DONE' })
    }
    restoreSession()
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password })
    const user = res.data?.user || res.data?.data?.user
    const accessToken = res.data?.accessToken || res.data?.data?.accessToken
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, accessToken },
    })
    toast.success(`Welcome back, ${user?.name || 'User'}!`)
    return normalizeUser(user)
  }, [])

  const register = useCallback(async (formData) => {
    const res = await authAPI.register(formData)
    const user = res.data?.user || res.data?.data?.user
    const accessToken = res.data?.accessToken || res.data?.data?.accessToken
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, accessToken },
    })
    toast.success('Account created successfully!')
    return normalizeUser(user)
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
