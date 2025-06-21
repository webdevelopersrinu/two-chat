import { useState, useEffect } from 'react'
import { userService } from '../services/api'
import { Search, X } from 'lucide-react'

function UserSearch({ onSelectUser, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers()
      } else {
        setUsers([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const searchUsers = async () => {
    setLoading(true)
    try {
      const response = await userService.searchUsers(searchQuery)
      if (response.data.success) {
        setUsers(response.data.users)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 animate-slide-up">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 text-sm"
          autoFocus
        />
        <button
          onClick={onClose}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="mt-2 text-center text-white/70 text-sm">
          Searching...
        </div>
      )}

      {users.length > 0 && (
        <div className="mt-2 max-h-60 overflow-y-auto scrollbar-thin">
          {users.map(user => (
            <button
              key={user._id}
              onClick={() => onSelectUser(user)}
              className="w-full p-3 hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                {user.displayName[0].toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-white font-medium">{user.displayName}</p>
                <p className="text-white/70 text-sm">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserSearch