import { useState, useEffect, useRef } from 'react'
import { chatService } from '../services/api'
import { useSocket } from '../context/SocketContext'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ChatHeader from './ChatHeader'
import toast from 'react-hot-toast'

function ChatWindow({ conversation, currentUser, onMessageSent }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const { socket, joinConversation, leaveConversation, sendMessage, isUserOnline } = useSocket()
  const previousConversationId = useRef(null)

  const otherParticipant = conversation.participants.find(p => p._id !== currentUser.id)

  useEffect(() => {
    // Leave previous conversation if exists
    if (previousConversationId.current && previousConversationId.current !== conversation._id) {
      leaveConversation(previousConversationId.current)
    }

    // Join new conversation
    joinConversation(conversation._id)
    previousConversationId.current = conversation._id

    // Load messages
    loadMessages()

    // Mark messages as read
    markMessagesAsRead()

    return () => {
      leaveConversation(conversation._id)
    }
  }, [conversation._id])

  useEffect(() => {
    if (!socket) return

    const handleReceiveMessage = (message) => {
      if (message.conversation === conversation._id) {
        setMessages(prev => [...prev, message])
        markMessagesAsRead()
      }
    }

    socket.on('receive_message', handleReceiveMessage)

    return () => {
      socket.off('receive_message', handleReceiveMessage)
    }
  }, [socket, conversation._id])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const response = await chatService.getMessages(conversation._id)
      if (response.data.success) {
        setMessages(response.data.messages)
      }
    } catch (error) {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async () => {
    try {
      await chatService.markAsRead(conversation._id)
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  }

  const handleSendMessage = (messageText) => {
    const tempId = Date.now().toString()
    
    // Add message to local state immediately
    const tempMessage = {
      _id: tempId,
      sender: { _id: currentUser.id },
      message: messageText,
      timestamp: new Date(),
      conversation: conversation._id
    }
    setMessages(prev => [...prev, tempMessage])

    // Send via socket
    sendMessage({
      senderId: currentUser.id,
      receiverId: otherParticipant._id,
      message: messageText,
      conversationId: conversation._id,
      senderName: currentUser.displayName
    })

    // Update conversation list
    onMessageSent(conversation._id, {
      ...tempMessage,
      sender: currentUser
    })
  }

  return (
    <div className="flex-1 flex flex-col">
      <ChatHeader 
        user={otherParticipant} 
        isOnline={isUserOnline(otherParticipant._id)}
      />
      
      <MessageList 
        messages={messages} 
        currentUserId={currentUser.id}
        loading={loading}
      />
      
      <MessageInput 
        onSendMessage={handleSendMessage}
        conversationId={conversation._id}
      />
    </div>
  )
}

export default ChatWindow