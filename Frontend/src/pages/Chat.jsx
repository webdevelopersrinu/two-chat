import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { chatService, userService } from '../services/api'
import ConversationList from '../components/ConversationList'
import ChatWindow from '../components/ChatWindow'
import UserSearch from '../components/UserSearch'
import toast from 'react-hot-toast'

function Chat() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await chatService.getConversations()
      if (response.data.success) {
        setConversations(response.data.conversations)
      }
    } catch (error) {
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUser = async (selectedUser) => {
    try {
      const response = await chatService.getOrCreateConversation(selectedUser._id)
      if (response.data.success) {
        setSelectedConversation(response.data.conversation)
        setShowSearch(false)
        
        // Add to conversations if new
        const exists = conversations.find(c => c._id === response.data.conversation._id)
        if (!exists) {
          setConversations([response.data.conversation, ...conversations])
        }
      }
    } catch (error) {
      toast.error('Failed to start conversation')
    }
  }

  const updateConversationList = (conversationId, lastMessage) => {
    setConversations(prev => {
      const updated = prev.map(conv => 
        conv._id === conversationId 
          ? { ...conv, lastMessage, lastActivity: new Date() }
          : conv
      )
      return updated.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-96 border-r border-white/20 flex flex-col">
          {/* User Header */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {user.displayName[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{user.displayName}</h3>
                  <p className="text-white/70 text-sm">@{user.username}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300"
                title="Search users"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            
            {showSearch && (
              <UserSearch 
                onSelectUser={handleSelectUser}
                onClose={() => setShowSearch(false)}
              />
            )}
          </div>

          {/* Conversations List */}
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
            currentUserId={user.id}
            loading={loading}
          />
        </div>

        {/* Chat Window */}
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            currentUser={user}
            onMessageSent={updateConversationList}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white/70">
              <svg className="w-24 h-24 mx-auto mb-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-xl mb-2">No conversation selected</p>
              <p className="text-sm">Choose a conversation or search for users to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat