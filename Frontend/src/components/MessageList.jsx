import { useEffect, useRef } from 'react'
import Message from './Message'

function MessageList({ messages, currentUserId, loading }) {
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-white/70">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 scrollbar-thin">
      {messages.length === 0 ? (
        <div className="text-center text-white/70 mt-8">
          <p className="text-sm sm:text-base">No messages yet. Start a conversation!</p>
        </div>
      ) : (
        messages.map((message) => (
          <Message 
            key={message._id || message.tempId} 
            message={message} 
            isOwn={message.sender === currentUserId || message.sender._id === currentUserId}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}

export default MessageList