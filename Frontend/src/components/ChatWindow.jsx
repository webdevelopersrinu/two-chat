import { useState, useEffect, useRef } from 'react'
import { chatService } from '../services/api'
import { useSocket } from '../context/SocketContext'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ChatHeader from './ChatHeader'
import toast from 'react-hot-toast'

function ChatWindow({ conversation, currentUser, onMessageSent, onBack }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const { socket, joinConversation, leaveConversation, sendMessage, isUserOnline } = useSocket()
  const conversationIdRef = useRef(null)

  const otherParticipant = conversation.participants.find(p => p._id !== currentUser.id)

  // Join/leave conversation rooms
  useEffect(() => {
    const currentConvId = conversation._id;
    
    // Leave previous conversation if different
    if (conversationIdRef.current && conversationIdRef.current !== currentConvId) {
      leaveConversation(conversationIdRef.current)
    }

    // Join new conversation
    joinConversation(currentConvId)
    conversationIdRef.current = currentConvId

    // Load messages
    loadMessages()

    // Mark messages as read
    markMessagesAsRead()

    return () => {
      if (currentConvId) {
        leaveConversation(currentConvId)
      }
    }
  }, [conversation._id])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleReceiveMessage = (newMessage) => {
      console.log('Received message:', newMessage);
      
      // Only add message if it belongs to current conversation
      if (newMessage.conversation === conversation._id) {
        setMessages(prevMessages => {
          // IMPORTANT: Skip if this is the sender's own message
          // Check if sender ID matches current user ID
          const isSenderMessage = newMessage.sender._id === currentUser.id || 
                                  newMessage.sender === currentUser.id;
          
          if (isSenderMessage) {
            // For sender's own messages, only update if it's replacing a temp message
            const tempMessageIndex = prevMessages.findIndex(m => 
              m.tempId && m.message === newMessage.message
            );
            
            if (tempMessageIndex !== -1) {
              // Replace temp message with confirmed message
              const updatedMessages = [...prevMessages];
              updatedMessages[tempMessageIndex] = {
                ...newMessage,
                tempId: undefined
              };
              return updatedMessages;
            }
            
            // If no temp message found, don't add (it's already there)
            return prevMessages;
          }
          
          // For messages from other users, check for duplicates
          const exists = prevMessages.some(m => m._id === newMessage._id);
          if (exists) return prevMessages;
          
          // Add new message from other user
          return [...prevMessages, newMessage];
        })
        
        // Mark as read if from other user
        if (newMessage.sender._id !== currentUser.id && newMessage.sender !== currentUser.id) {
          markMessagesAsRead()
        }
      }
    }

    // Listen for messages
    socket.on('receive_message', handleReceiveMessage)

    return () => {
      socket.off('receive_message', handleReceiveMessage)
    }
  }, [socket, conversation._id, currentUser.id])

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
    
    // Create temp message for immediate display
    const tempMessage = {
      _id: tempId,
      tempId: tempId,
      sender: { 
        _id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName 
      },
      message: messageText,
      timestamp: new Date().toISOString(),
      conversation: conversation._id
    }
    
    // Add to local messages immediately
    setMessages(prev => [...prev, tempMessage])

    // Send via socket
    sendMessage({
      tempId: tempId,
      senderId: currentUser.id,
      receiverId: otherParticipant._id,
      message: messageText,
      conversationId: conversation._id,
      senderName: currentUser.displayName
    })

    // Update conversation list
    onMessageSent(conversation._id, tempMessage)
  }

  return (
    <div className="flex-1 flex flex-col">
      <ChatHeader 
        user={otherParticipant} 
        isOnline={isUserOnline(otherParticipant._id)}
        onBack={onBack}
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