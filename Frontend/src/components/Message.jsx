function Message({ message, isOwn }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up`}>
      <div 
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
          isOwn 
            ? 'bg-white text-purple-600' 
            : 'bg-white/20 text-white'
        }`}
      >
        <p className="text-sm break-words">{message.message}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-purple-400' : 'text-white/60'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}

export default Message