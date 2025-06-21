import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { chatService } from '../services/api'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import ChatHeader from '../components/ChatHeader'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'

function Chat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const socketRef = useRef()

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket']
    })

    // Connect user
    socketRef.current.emit('user_connected', user.id)

    // Listen for online users
    socketRef.current.on('users_online', (users) => {
      setOnlineUsers(users)
    })

    // Listen for new messages
    socketRef.current.on('receive_message', (message) => {
      setMessages(prev => [...prev, message])
    })

    // Listen for message sent confirmation
    socketRef.current.on('message_sent', (data) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.tempId === data.tempId 
            ? { ...msg, _id: data._id, timestamp: data.timestamp } 
            : msg
        )
      )
    })

    // Load initial data
    loadChatData()

    return () => {
      socketRef.current.disconnect()
    }
  }, [user.id])

  const loadChatData = async () => {
    try {
      // Get other user
      const otherUserResponse = await chatService.getOtherUser()
      if (otherUserResponse.data.success && otherUserResponse.data.user) {
        setOtherUser(otherUserResponse.data.user)
        
        // Get messages
        const messagesResponse = await chatService.getMessages(otherUserResponse.data.user._id)
        if (messagesResponse.data.success) {
          setMessages(messagesResponse.data.messages)
        }
      }
    } catch (error) {
      toast.error('Failed to load chat data')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = (messageText) => {
    if (!otherUser || !messageText.trim()) return

    const tempId = Date.now().toString()
    const newMessage = {
      tempId,
      sender: user.id,
      receiver: otherUser._id,
      message: messageText,
      timestamp: new Date()
    }

    // Add to local messages immediately
    setMessages(prev => [...prev, newMessage])

    // Send via socket
    socketRef.current.emit('send_message', {
      senderId: user.id,
      receiverId: otherUser._id,
      message: messageText
    })
  }

  const isUserOnline = otherUser && onlineUsers.includes(otherUser._id)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading chat...</div>
      </div>
    )
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-xl text-center">
          <p>Waiting for another user to join...</p>
          <p className="text-sm mt-2 opacity-80">You're the only user registered so far.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col animate-fade-in">
        <ChatHeader 
          otherUser={otherUser} 
          isOnline={isUserOnline} 
        />
        
        <MessageList 
          messages={messages} 
          currentUserId={user.id} 
        />
        
        <MessageInput 
          onSendMessage={sendMessage} 
        />
      </div>
    </div>
  )
}

export default Chat