import { createContext, useContext, useEffect, useRef, useState } from 'react'
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
  const [onlineUsers, setOnlineUsers] = useState([])

  useEffect(() => {
    if (!user) return

    // Initialize socket connection
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Connect user
    socketRef.current.emit('user_connected', user.id)

    // Listen for online users
    socketRef.current.on('users_online', (users) => {
      setOnlineUsers(users)
    })

    // Listen for new message notifications
    socketRef.current.on('new_message_notification', ({ conversationId, message, senderName }) => {
      // Only show notification if not in the conversation
      const currentPath = window.location.pathname
      if (!currentPath.includes(conversationId)) {
        toast(`New message from ${senderName}`, {
          icon: '💬',
          duration: 4000
        })
      }
    })

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('Socket connected')
      socketRef.current.emit('user_connected', user.id)
    })

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [user])

  const notifyNewConversation = (conversationId, participants) => {
    if (socketRef.current) {
      console.log('Emitting new conversation:', conversationId)
      socketRef.current.emit('new_conversation_created', {
        conversationId,
        participants
      })
    }
  }

  const joinConversation = (conversationId) => {
    if (socketRef.current && conversationId) {
      console.log('Joining conversation:', conversationId)
      socketRef.current.emit('join_conversation', conversationId)
    }
  }

  const leaveConversation = (conversationId) => {
    if (socketRef.current && conversationId) {
      console.log('Leaving conversation:', conversationId)
      socketRef.current.emit('leave_conversation', conversationId)
    }
  }

  const sendMessage = (data) => {
    if (socketRef.current) {
      console.log('Sending message:', data)
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
    return onlineUsers.includes(userId)
  }

  const value = {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    sendMessage,
    emitTyping,
    isUserOnline,
    onlineUsers,
    notifyNewConversation
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}