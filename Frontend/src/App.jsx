import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Chat from './pages/Chat'
import { SocketProvider } from './context/SocketContext'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/chat" />} 
        />
        <Route 
          path="/chat" 
          element={
            user ? (
              <SocketProvider>
                <Chat />
              </SocketProvider>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/chat" : "/login"} />} 
        />
      </Routes>
    </Router>
  )
}

export default App