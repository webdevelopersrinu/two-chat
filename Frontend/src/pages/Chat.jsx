import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { chatService } from '../services/api'
import { useSocket } from '../context/SocketContext'
import ConversationList from '../components/ConversationList'
import ChatWindow from '../components/ChatWindow'
import UserSearch from '../components/UserSearch'
import MobileMenu from '../components/MobileMenu'
import { Menu } from 'lucide-react'
import toast from 'react-hot-toast'

function Chat() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const { socket } = useSocket()

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleNewConversation = ({ conversation }) => {
      console.log('New conversation received:', conversation)

      // Add the new conversation to the list
      setConversations(prev => {
        // Check if conversation already exists
        const exists = prev.some(c => c._id === conversation._id)
        if (exists) return prev

        // Add new conversation at the top
        return [conversation, ...prev]
      })

      // Show notification
      const otherUser = conversation.participants.find(p => p._id !== user.id)
      if (otherUser) {
        toast(`${otherUser.displayName} started a conversation with you!`, {
          icon: '💬',
          duration: 5000
        })
      }
    }

    socket.on('new_conversation', handleNewConversation)

    return () => {
      socket.off('new_conversation', handleNewConversation)
    }
  }, [socket, user.id])

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
        const conversation = response.data.conversation
        setSelectedConversation(conversation)
        setShowSearch(false)
        setShowMobileSidebar(false)

        // Check if this is a new conversation
        const exists = conversations.find(c => c._id === conversation._id)
        if (!exists) {
          // Add to local conversations
          setConversations([conversation, ...conversations])

          // Notify other participants about the new conversation
          if (socket) {
            socket.emit('new_conversation_created', {
              conversationId: conversation._id,
              participants: conversation.participants.map(p => p._id || p)
            })
          }
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

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation)
    setShowMobileSidebar(false)
  }

  return (
    <div className="min-h-screen h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white/10 backdrop-blur-lg sm:rounded-3xl shadow-2xl w-full h-full sm:h-[90vh] max-w-7xl flex overflow-hidden relative">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="lg:hidden absolute top-4 left-4 z-40 p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>

        {/* Left Sidebar - Desktop */}
        <div className="hidden lg:flex w-80 xl:w-96 border-r border-white/20 flex-col">
          {/* User Header */}
          <div className="p-4 xl:p-6 border-b border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 xl:w-12 xl:h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg xl:text-xl">
                  {user.displayName[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-semibold truncate">{user.displayName}</h3>
                  <p className="text-white/70 text-sm truncate">@{user.username}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 flex-shrink-0"
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
            onSelectConversation={handleSelectConversation}
            currentUserId={user.id}
            loading={loading}
          />
        </div>

        {/* Mobile Sidebar */}
        <MobileMenu
          isOpen={showMobileSidebar}
          onClose={() => setShowMobileSidebar(false)}
          user={user}
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          onSelectUser={handleSelectUser}
          loading={loading}
        />

        {/* Chat Window */}
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            currentUser={user}
            onMessageSent={updateConversationList}
            onBack={() => setShowMobileSidebar(true)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-white/70">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg sm:text-xl mb-2">No conversation selected</p>
              <p className="text-xs sm:text-sm px-4">Choose a conversation or search for users to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat