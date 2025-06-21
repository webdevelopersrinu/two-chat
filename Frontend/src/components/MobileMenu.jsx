import { useState } from 'react'
import { X, Search, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import UserSearch from './UserSearch'
import ConversationList from './ConversationList'
import toast from 'react-hot-toast'

function MobileMenu({ isOpen, onClose, user, conversations, selectedConversation, onSelectConversation, onSelectUser, loading }) {
  const [showSearch, setShowSearch] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="absolute left-0 top-0 h-full w-full max-w-sm bg-white/10 backdrop-blur-lg flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user.displayName[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-semibold truncate">{user.displayName}</h3>
                <p className="text-white/70 text-sm truncate">@{user.username}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex-1 p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Search className="w-4 h-4 text-white" />
              <span className="text-white text-sm">Search</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4 text-white" />
              <span className="text-white text-sm">Logout</span>
            </button>
          </div>
          
          {showSearch && (
            <UserSearch 
              onSelectUser={(user) => {
                onSelectUser(user)
                setShowSearch(false)
              }}
              onClose={() => setShowSearch(false)}
            />
          )}
        </div>
        
        {/* Conversations */}
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={onSelectConversation}
          currentUserId={user.id}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default MobileMenu