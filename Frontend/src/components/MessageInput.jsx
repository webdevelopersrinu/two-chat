import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useSocket } from '../context/SocketContext'

function MessageInput({ onSendMessage, conversationId }) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const { emitTyping } = useSocket()
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleTyping = (e) => {
    setMessage(e.target.value)

    if (!isTyping) {
      setIsTyping(true)
      emitTyping(conversationId, true)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      emitTyping(conversationId, false)
    }, 1000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim()) {
      onSendMessage(message)
      setMessage('')
      
      if (isTyping) {
        setIsTyping(false)
        emitTyping(conversationId, false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 border-t border-white/20">
      <div className="flex space-x-4">
        <input
          type="text"
          value={message}
          onChange={handleTyping}
          placeholder="Type your message..."
          className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-white/90 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  )
}

export default MessageInput