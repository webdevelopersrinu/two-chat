import { createContext, useContext, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const socketRef = useRef()
  const onlineUsersRef = useRef(new Set())

  useEffect(() => {
    if (!user) return

    // Initialize socket connection
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket']
    })

    // Connect user
    socketRef.current.emit('user_connected', user.id)

    // Listen for online users
    socketRef.current.on('users_online', (users) => {
      onlineUsersRef.current = new Set(users)
    })

    // Listen for new message notifications
    socketRef.current.on('new_message_notification', ({ conversationId, message, senderName }) => {
      toast(`New message from ${senderName}`, {
        icon: '💬',
        duration: 4000
      })
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [user])

  const joinConversation = (conversationId) => {
    if (socketRef.current) {
      socketRef.current.emit('join_conversation', conversationId)
    }
  }

  const leaveConversation = (conversationId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_conversation', conversationId)
    }
  }

  const sendMessage = (data) => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', data)
    }
  }

  const emitTyping = (conversationId, isTyping) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', {
        conversationId,
        userId: user.id,
        isTyping
      })
    }
  }

  const isUserOnline = (userId) => {
    return onlineUsersRef.current.has(userId)
  }

  const value = {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    sendMessage,
    emitTyping,
    isUserOnline
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}