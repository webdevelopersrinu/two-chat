import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

function ChatHeader({ user, isOnline, onBack }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="bg-white/20 backdrop-blur-sm p-4 sm:p-6 border-b border-white/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Back button for mobile */}
          <button
            onClick={onBack}
            className="lg:hidden p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
            {user.displayName[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-white truncate">{user.displayName}</h2>
            <p className="text-xs sm:text-sm text-white/70">
              {isOnline ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1 sm:mr-2"></span>
                  Online
                </span>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="hidden sm:block p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default ChatHeader