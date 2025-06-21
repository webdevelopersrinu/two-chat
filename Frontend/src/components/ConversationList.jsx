import { format } from 'date-fns'
import { useSocket } from '../context/SocketContext'

function ConversationList({ conversations, selectedConversation, onSelectConversation, currentUserId, loading }) {
  const { isUserOnline } = useSocket()

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p._id !== currentUserId)
  }

  const formatLastMessage = (message) => {
    if (!message) return 'No messages yet'
    
    const isOwn = message.sender._id === currentUserId
    const sender = isOwn ? 'You: ' : ''
    const text = message.message.length > 40 
      ? message.message.substring(0, 40) + '...' 
      : message.message
    
    return sender + text
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white/70">Loading conversations...</div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-white/70 px-6">
          <p>No conversations yet</p>
          <p className="text-sm mt-2">Search for users to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {conversations.map(conversation => {
        const otherUser = getOtherParticipant(conversation)
        const isSelected = selectedConversation?._id === conversation._id
        const isOnline = isUserOnline(otherUser._id)

        return (
          <button
            key={conversation._id}
            onClick={() => onSelectConversation(conversation)}
            className={`w-full p-4 hover:bg-white/10 transition-all duration-200 flex items-center space-x-3 ${
              isSelected ? 'bg-white/20' : ''
            }`}
          >
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {otherUser.displayName[0].toUpperCase()}
              </div>
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white/20"></div>
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">{otherUser.displayName}</h4>
                {conversation.lastMessage && (
                  <span className="text-white/60 text-xs">
                    {format(new Date(conversation.lastMessage.timestamp), 'HH:mm')}
                  </span>
                )}
              </div>
              <p className="text-white/70 text-sm truncate">
                {formatLastMessage(conversation.lastMessage)}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default ConversationList