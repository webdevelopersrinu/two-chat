import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function ChatHeader({ otherUser, isOnline }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-t-3xl p-6 border-b border-white/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {otherUser.username[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{otherUser.username}</h2>
            <p className="text-sm text-white/70">
              {isOnline ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Online
                </span>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-white/70 text-sm">Logged in as {user.username}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatHeader