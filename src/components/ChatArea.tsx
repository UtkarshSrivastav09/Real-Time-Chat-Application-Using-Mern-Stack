import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useChat } from '../context/ChatContext';
import { useToast } from '../context/ToastContext';
import { Send, MoreVertical, Search, Paperclip, Smile, CheckCheck, Globe, Mic, Square, ArrowLeft, Heart, ThumbsUp, MessageCircle, XCircle, MessageSquare, UserMinus, ChevronDown, Trash2, MoreHorizontal, FileText, Camera, Image, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatArea: React.FC = () => {
  const { currentUser, users, messages, activeChat, sendMessage, logout, setActiveChat, addReaction, deleteUser, deleteMessage, typingUsers, sendTypingStatus } = useChat();
  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  
  const emojis = ['😊', '😂', '❤️', '👍', '🔥', '🙌', '😎', '🤔', '😢', '😍', '✨', '🎉', '🚀', '💯', '🙏', '💡', '✅', '❌', '🍕', '💻'];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sendMessage(`📁 ${file.name}`, 'text');
      showToast(`Uploading ${file.name}...`, 'success');
    }
  };

  const shareLocation = () => {
    if ("geolocation" in navigator) {
      showToast('Fetching location...', 'info');
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        sendMessage(`📍 Location: https://www.google.com/maps?q=${latitude},${longitude}`, 'text');
        showToast('Location shared!', 'success');
      }, (error) => {
        showToast('Location access denied', 'error');
      });
    } else {
      showToast('Geolocation not supported', 'error');
    }
  };

  const attachments = [
    { icon: <FileText className="w-5 h-5" />, label: 'Document', color: 'bg-[#7f66ff]', action: () => fileInputRef.current?.click() },
    { icon: <Camera className="w-5 h-5" />, label: 'Camera', color: 'bg-[#ff2e74]', action: () => { showToast('Camera active', 'info'); sendMessage('📷 Photo', 'text'); } },
    { icon: <Image className="w-5 h-5" />, label: 'Gallery', color: 'bg-[#007bfc]', action: () => fileInputRef.current?.click() },
    { icon: <User className="w-5 h-5" />, label: 'Contact', color: 'bg-[#ff8a00]', action: () => { showToast('Contact list opened', 'info'); sendMessage('👤 Contact: John Doe', 'text'); } },
    { icon: <MapPin className="w-5 h-5" />, label: 'Location', color: 'bg-[#00a884]', action: shareLocation },
    { icon: <Mic className="w-5 h-5" />, label: 'Audio', color: 'bg-[#ff5722]', action: () => { startRecording(); setAttachmentMenuOpen(false); } },
    { icon: <CheckCheck className="w-5 h-5" />, label: 'Poll', color: 'bg-[#ffc107]', action: () => { showToast('Poll created', 'info'); sendMessage('📊 New Poll Created', 'text'); } },
  ];
  
  const [activeMsgMenu, setActiveMsgMenu] = useState<string | null>(null);

  const activeUser = useMemo(() => users.find(u => u._id === activeChat), [users, activeChat]);

  const activeMessages = useMemo(() => {
    return messages.filter(m => {
        const senderId = String(typeof m.sender === 'object' ? m.sender._id : m.sender);
        const curId = String(currentUser?._id);
        const actId = String(activeChat);

        return (m.receiver === 'global' && actId === 'global') ||
               (actId !== 'global' && (
                 (senderId === curId && m.receiver === actId) || 
                 (senderId === actId && m.receiver === curId)
               ));
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, activeChat, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          sendMessage('🎤 Voice Message (0:05)', 'voice');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      sendMessage(text.trim());
      setText('');
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b141a] relative font-sans overflow-hidden">
      {/* Premium Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#0b141a]" />
        <div className="absolute inset-0 opacity-[0.05]" 
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-matter.png")' }} />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,#00a8840a_0%,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,#00a8840a_0%,transparent_50%)]" />
      </div>

      {/* Header - Enhanced */}
      <header className="h-[75px] px-6 py-3 flex items-center justify-between bg-[#111b21]/80 backdrop-blur-xl border-b border-white/5 z-20">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setActiveChat('')}
            className="md:hidden p-2 -ml-2 text-[#aebac1] hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="relative group">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center p-0.5 transition-all duration-500",
              (activeUser?.isOnline || activeChat === 'global') ? "bg-gradient-to-tr from-[#00a884] to-[#00c9a0]" : "bg-gray-700"
            )}>
                <div className="w-full h-full rounded-full bg-[#111b21] flex items-center justify-center overflow-hidden">
                    {activeChat === 'global' ? (
                        <Globe className="w-6 h-6 text-[#00a884]" />
                    ) : (
                        <img src={activeUser?.avatar} alt={activeUser?.username} className="w-full h-full object-cover" />
                    )}
                </div>
            </div>
            {(activeUser?.isOnline || activeChat === 'global') && (
               <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00a884] border-2 border-[#111b21] rounded-full" />
            )}
          </div>

          <div>
            <h2 className="text-white font-bold text-lg tracking-tight leading-none mb-1.5 flex items-center">
              {activeChat === 'global' ? 'Nexus Community' : activeUser?.username}
              <CheckCheck className="w-3.5 h-3.5 ml-2 text-[#00a884]" />
            </h2>
            <div className="flex items-center space-x-2">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  (activeUser?.isOnline || activeChat === 'global') ? "bg-[#00a884] animate-pulse" : "bg-[#8696a0]"
                )} />
                <span className="text-[11px] text-[#8696a0] uppercase tracking-widest font-bold">
                  {typingUsers[activeChat] ? (
                    <span className="text-[#00a884] animate-pulse normal-case font-black">typing...</span>
                  ) : (
                    activeChat === 'global' ? 'Global Channel' : (activeUser?.isOnline ? 'Online Now' : 'Offline')
                  )}
                </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-3 text-[#8696a0] hover:text-white hover:bg-white/5 rounded-2xl transition-all">
            <Search className="w-5 h-5" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "p-3 rounded-2xl transition-all",
                menuOpen ? "bg-[#00a884] text-white" : "text-[#8696a0] hover:text-white hover:bg-white/5"
              )}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {menuOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40" 
                    onClick={() => setMenuOpen(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 top-full mt-3 w-56 bg-[#111b21] border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 p-2 backdrop-blur-2xl overflow-hidden"
                  >
                    <div className="p-2 space-y-1">
                      <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-[#e9edef] text-sm hover:bg-white/5 transition-all">
                        <MessageCircle className="w-4 h-4 text-[#8696a0]" />
                        <span>Chat Info</span>
                      </button>
                      
                      {activeChat !== 'global' && (
                        <button 
                          onClick={() => {
                            if(window.confirm(`Delete ${activeUser?.username} and all messages?`)) {
                              deleteUser(activeChat);
                              setMenuOpen(false);
                            }
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-red-400 text-sm hover:bg-red-400/5 transition-all"
                        >
                          <UserMinus className="w-4 h-4" />
                          <span>Delete Contact</span>
                        </button>
                      )}

                      <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-red-400 text-sm hover:bg-red-400/5 transition-all"
                              onClick={() => { if(window.confirm('Establish logout?')) logout(); }}>
                        <XCircle className="w-4 h-4" />
                        <span>Logout System</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Messages Area - Enhanced Bubble Design */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 z-10 custom-scrollbar scroll-smooth">
        <AnimatePresence initial={false}>
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
              <MessageSquare className="w-16 h-16 text-[#00a884]" />
              <p className="text-white text-sm font-medium tracking-widest uppercase">Start conversation</p>
            </div>
          ) : (
            activeMessages.map((msg, idx) => {
              const senderId = String(typeof msg.sender === 'object' ? msg.sender._id : msg.sender);
              const isMine = senderId === String(currentUser._id);
              const sender = typeof msg.sender === 'object' ? msg.sender : users.find(u => String(u._id) === senderId);
              
              // Date logic
              const showDate = idx === 0 || 
                new Date(msg.createdAt).toDateString() !== new Date(activeMessages[idx-1].createdAt).toDateString();

              return (
                <React.Fragment key={msg._id}>
                  {showDate && (
                    <div className="flex justify-center my-8">
                       <span className="bg-[#111b21]/50 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] text-[#8696a0] font-bold uppercase tracking-widest border border-white/5">
                          {format(new Date(msg.createdAt), 'MMMM dd, yyyy')}
                       </span>
                    </div>
                  )}
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className={cn("flex w-full mb-1", isMine ? "justify-end" : "justify-start")}
                  >
                    <div className={cn(
                      "relative group flex flex-col",
                      isMine ? "items-end" : "items-start"
                    )}>
                      {!isMine && activeChat === 'global' && (
                        <span className="text-[10px] font-black text-[#00a884] uppercase tracking-widest mb-1.5 ml-2">
                          {sender?.username}
                        </span>
                      )}
                      
                      <div className={cn(
                        "relative px-5 py-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all group-hover:scale-[1.01] duration-300",
                        isMine 
                          ? "bg-gradient-to-br from-[#00a884] to-[#008f72] text-[#e9edef] rounded-[24px] rounded-tr-[4px] shadow-[#00a8841a]" 
                          : "bg-[#202c33] backdrop-blur-md text-[#e9edef] rounded-[24px] rounded-tl-[4px] border border-white/5"
                      )}>
                        {/* Message Actions - Three dots */}
                        {isMine && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMsgMenu(activeMsgMenu === msg._id ? null : msg._id);
                              }}
                              className="p-1 hover:bg-black/10 rounded-full transition-colors text-white/50 hover:text-white"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {activeMsgMenu === msg._id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveMsgMenu(null)} />
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="absolute right-0 top-full mt-1 bg-[#202c33] border border-white/10 rounded-xl shadow-2xl z-50 p-1 min-w-[120px] backdrop-blur-xl"
                                >
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if(window.confirm('Delete message?')) {
                                        deleteMessage(msg._id);
                                        setActiveMsgMenu(null);
                                      }
                                    }}
                                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-red-400 text-xs hover:bg-white/5 transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Quick Reaction Bar on Hover */}
                        {!activeMsgMenu && (
                          <div className={cn(
                            "absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center space-x-1 bg-[#233138] border border-white/10 rounded-full p-1 shadow-2xl z-30",
                            isMine ? "right-0" : "left-0"
                          )}>
                            {['❤️', '👍', '😂', '😮', '😢', '🙏'].map(emoji => (
                              <button 
                                key={emoji}
                                onClick={() => addReaction(msg._id, emoji)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-transform hover:scale-125 active:scale-90 text-sm"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        <p className={cn(
                          "text-[15px] leading-relaxed whitespace-pre-wrap",
                          isMine ? "pr-10" : "pr-8"
                        )}>{msg.text}</p>
                        
                        <div className="flex items-center justify-end mt-2 space-x-2">
                          <span className={cn(
                            "text-[10px] font-bold opacity-50",
                            isMine ? "text-white" : "text-[#8696a0]"
                          )}>
                            {format(new Date(msg.createdAt), 'HH:mm')}
                          </span>
                          {isMine && (
                            <CheckCheck className={cn(
                              "w-3.5 h-3.5 transition-colors duration-500",
                              msg.status === 'read' ? "text-[#53bdeb]" : "text-white/40"
                            )} />
                          )}
                        </div>

                        {/* Quick Reaction Pill */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className={cn(
                            "absolute -bottom-3 flex bg-[#202c33] border border-white/10 px-1.5 py-0.5 rounded-full space-x-1 shadow-lg",
                            isMine ? "right-4" : "left-4"
                          )}>
                             {Object.entries(msg.reactions).map(([emoji, users]) => (
                               <span key={emoji} className="text-[10px] flex items-center">
                                 {emoji} <span className="ml-1 opacity-60">{(users as string[]).length}</span>
                               </span>
                             ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Redesigned Floating Experience */}
      <div className="p-6 md:p-8 z-20">
        <motion.div 
          layout
          className="max-w-[900px] mx-auto bg-[#111b21]/90 backdrop-blur-3xl rounded-[30px] p-2 flex items-center space-x-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
        >
          <div className="flex items-center space-x-1.5 md:space-x-2 relative">
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                />
                
                {/* Emoji Picker */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setEmojiPickerOpen(!emojiPickerOpen);
                      setAttachmentMenuOpen(false);
                    }}
                    className={cn(
                      "p-2.5 rounded-xl transition-all duration-300",
                      emojiPickerOpen ? "bg-[#00a884] text-white shadow-lg" : "text-[#8696a0] hover:text-[#e9edef] hover:bg-white/5"
                    )}
                  >
                    <Smile className="w-6 h-6" />
                  </button>

                  <AnimatePresence>
                    {emojiPickerOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setEmojiPickerOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="absolute bottom-full mb-4 left-0 bg-[#233138] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-3 z-50 w-[280px] grid grid-cols-5 gap-2"
                        >
                          {emojis.map(emoji => (
                            <button 
                              key={emoji}
                              onClick={() => {
                                setText(prev => prev + emoji);
                              }}
                              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-transform hover:scale-125 active:scale-90 text-xl"
                            >
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Attachment Menu */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setAttachmentMenuOpen(!attachmentMenuOpen);
                      setEmojiPickerOpen(false);
                    }}
                    className={cn(
                      "p-2.5 rounded-xl transition-all duration-300",
                      attachmentMenuOpen ? "bg-[#00a884] text-white shadow-lg" : "text-[#8696a0] hover:text-[#e9edef] hover:bg-white/5"
                    )}
                  >
                    <Paperclip className="w-6 h-6" />
                  </button>

                  <AnimatePresence>
                    {attachmentMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setAttachmentMenuOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="absolute bottom-full mb-4 left-0 bg-[#233138] border border-white/10 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-4 z-50 w-[240px] space-y-1"
                        >
                          {attachments.map((item, idx) => (
                            <button 
                              key={idx}
                              onClick={() => {
                                item.action();
                                setAttachmentMenuOpen(false);
                              }}
                              className="w-full flex items-center space-x-4 p-2.5 hover:bg-white/5 rounded-xl transition-colors group"
                            >
                              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform", item.color)}>
                                {item.icon}
                              </div>
                              <span className="text-sm text-[#e9edef] font-medium">{item.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
            </div>

          {isRecording ? (
              <div className="flex-1 flex items-center bg-white/5 rounded-2xl px-6 py-3 text-[#00a884] space-x-6">
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]"
                  />
                  <span className="text-sm font-bold tracking-widest uppercase">
                    Capturing Audio: {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                  </span>
              </div>
          ) : (
              <form onSubmit={handleSend} className="flex-1">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => {
                    const val = e.target.value;
                    setText(val);
                    sendTypingStatus(activeChat, val.length > 0);
                    // Clear typing status after 2s of inactivity
                    const timeout = setTimeout(() => {
                      sendTypingStatus(activeChat, false);
                    }, 2000);
                    return () => clearTimeout(timeout);
                  }}
                  onBlur={() => sendTypingStatus(activeChat, false)}
                  placeholder="Type a message..."
                  className="w-full bg-transparent border-none text-white text-[15px] py-3 px-2 focus:outline-none placeholder-white/20 font-medium"
                />
              </form>
          )}

          <div className="pr-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={text.trim() || isRecording ? (isRecording ? stopRecording : handleSend) : startRecording}
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 shadow-xl",
                (text.trim() || isRecording) 
                  ? "bg-gradient-to-br from-[#00a884] to-[#008f72] text-[#111b21]" 
                  : "bg-white/5 text-[#8696a0] hover:text-white"
              )}
            >
              {isRecording ? (
                <Square className="w-5 h-5 fill-current" />
              ) : text.trim() ? (
                <Send className="w-5 h-5 fill-current" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
