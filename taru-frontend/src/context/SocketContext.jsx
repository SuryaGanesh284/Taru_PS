import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext.jsx'

const SocketContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export function SocketProvider({ children }) {
  const { isAuthenticated, accessToken } = useAuth()
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setIsConnected(false)
      }
      return
    }

    // Connect socket with auth token
    socketRef.current = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socketRef.current.on('connect', () => {
      setIsConnected(true)
    })

    socketRef.current.on('disconnect', () => {
      setIsConnected(false)
    })

    socketRef.current.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message)
      setIsConnected(false)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setIsConnected(false)
      }
    }
  }, [isAuthenticated, accessToken])

  // Subscribe to a socket event
  const on = (event, handler) => {
    socketRef.current?.on(event, handler)
  }

  // Unsubscribe from a socket event
  const off = (event, handler) => {
    socketRef.current?.off(event, handler)
  }

  // Emit a socket event
  const emit = (event, data) => {
    socketRef.current?.emit(event, data)
  }

  const value = {
    socket: socketRef.current,
    isConnected,
    on,
    off,
    emit,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used inside a SocketProvider')
  }
  return context
}
