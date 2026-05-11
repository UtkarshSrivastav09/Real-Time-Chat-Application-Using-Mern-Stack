import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { MessageSquare, MoreVertical, CircleDot, Search, Filter, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export const Sidebar: React.FC = () => {
  const { currentUser, users, messages, activeChat, setActiveChat, logout, unreadCounts, markAsRead, typingUsers } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredUsers = users.filter(u => 
    u._id !== currentUser?._id && 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLatestMessage = (userId: string) => {
    const userMsgs = messages.filter(m => {
      const sid = String(typeof m.sender === 'object' ? m.sender._id : m.sender);
      const rid = String(m.receiver);
      const targetId = String(userId);
      return sid === targetId || rid === targetId;
    });
    return userMsgs[userMsgs.length - 1];
  };

  return (
    <div className="w-full md:w-[400px] h-full flex flex-col bg-[#111b21] border-r border-gray-700/50">
      {/* Header */}
      <div className="h-[60px] px-4 py-2 flex items-center justify-between bg-[#202c33]">
        <div className="flex items-center space-x-3">
          <img 
            src={currentUser?.avatar} 
            alt="My Avatar" 
            className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => { if(window.confirm('Logout?')) logout() }}
          />
          <span className="text-[#e9edef] font-medium text-sm hidden sm:block">
            {currentUser?.username}
          </span>
        </div>
        <div className="flex items-center space-x-6 text-[#aebac1] relative">
          <CircleDot className="w-5 h-5 cursor-pointer hover:text-white" />
          <MessageSquare className="w-5 h-5 cursor-pointer hover:text-white" />
          <div className="relative">
            <MoreVertical 
              className={cn("w-5 h-5 cursor-pointer transition-colors", menuOpen ? "text-white" : "hover:text-white")}
              onClick={() => setMenuOpen(!menuOpen)}
            />
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-3 w-44 bg-[#233138] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 p-2 border border-white/10 animate-in fade-in zoom-in duration-200 origin-top-right">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation();
                      if(window.confirm('Are you sure you want to logout?')) {
                        setMenuOpen(false);
                        logout();
                      }
                    }}
                    className="w-full bg-white text-[#111b21] hover:bg-[#e9edef] font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center space-x-2 active:scale-95"
                  >
                    Logout
                  </button>
                  <div className="mt-2 px-3 py-2 bg-[#182229]/50 rounded-xl">
                    <div className="text-[9px] text-[#8696a0] uppercase tracking-widest font-bold mb-1">
                      Stats
                    </div>
                    <div className="text-[11px] text-[#d1d7db]">
                      {messages.length} Messages
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 bg-[#111b21]">
        <div className="relative flex items-center bg-[#202c33] rounded-xl px-4 py-2 shadow-inner group">
          <Search className="w-4 h-4 text-[#8696a0] mr-4 group-focus-within:text-[#00a884] transition-colors" />
          <input 
            type="text" 
            placeholder="Search or start new chat"
            className="bg-transparent border-none text-[#d1d7db] text-sm w-full focus:outline-none placeholder-[#8696a0]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Filter className="w-4 h-4 text-[#8696a0] ml-2 cursor-pointer hover:text-[#00a884]" />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Global Chat */}
        <div 
          onClick={() => {
            setActiveChat('global');
            markAsRead('global');
          }}
          className={cn(
            "flex items-center px-4 py-3 cursor-pointer transition-colors border-b border-gray-800/30",
            activeChat === 'global' ? "bg-[#2a3942]" : "hover:bg-[#202c33]"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-[#00a884]/20 flex items-center justify-center mr-4">
            <Globe className="w-6 h-6 text-[#00a884]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-0.5">
              <h3 className="text-[#e9edef] font-medium truncate">Nexus Community</h3>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-[#8696a0]">Group</span>
                {unreadCounts['global'] > 0 && (
                   <span className="bg-[#25d366] text-[#111b21] text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm animate-pulse">
                     {unreadCounts['global']}
                   </span>
                )}
              </div>
            </div>
            <p className="text-sm text-[#8696a0] truncate">Chat with everyone</p>
          </div>
        </div>

        {/* Individual Chats */}
        <div className="px-2 py-2 space-y-1.5">
          {filteredUsers.map(user => {
            const lastMsg = getLatestMessage(user._id);
            const isActive = activeChat === user._id;
            const isTyping = typingUsers[user._id];

            return (
              <motion.div 
                key={user._id}
                whileHover={{ x: 4 }}
                onClick={() => {
                  setActiveChat(user._id);
                  markAsRead(user._id);
                }}
                className={cn(
                  "group relative flex items-center px-4 py-3.5 cursor-pointer transition-all rounded-[20px] overflow-hidden",
                  isActive 
                    ? "bg-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-md border border-white/10" 
                    : "hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#00a884] rounded-full shadow-[0_0_15px_#00a884]"
                  />
                )}

                <div className="relative mr-4 shrink-0">
                  <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-transparent to-transparent group-hover:from-[#00a884] group-hover:to-[#00c9a0] transition-all duration-500">
                    <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover border-2 border-[#111b21]" />
                  </div>
                  {user.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#25d366] border-[3px] border-[#111b21] rounded-full shadow-lg" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[#e9edef] font-bold text-[15px] truncate group-hover:text-white transition-colors">
                      {user.username}
                    </h3>
                    {lastMsg && (
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-tighter",
                        unreadCounts[user._id] > 0 ? "text-[#25d366]" : "text-[#8696a0]"
                      )}>
                        {format(new Date(lastMsg.createdAt), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-xs truncate flex-1 font-medium",
                      unreadCounts[user._id] > 0 ? "text-[#d1d7db] font-bold" : "text-[#8696a0]"
                    )}>
                      {isTyping ? (
                        <span className="text-[#00a884] italic animate-pulse">typing...</span>
                      ) : (
                        lastMsg ? lastMsg.text : 'No messages yet'
                      )}
                    </p>
                    
                    {unreadCounts[user._id] > 0 && (
                      <div className="ml-2">
                        <span className="bg-gradient-to-br from-[#00a884] to-[#00c9a0] text-[#111b21] text-[10px] font-black min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,168,132,0.4)]">
                          {unreadCounts[user._id]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};