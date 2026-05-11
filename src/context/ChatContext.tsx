import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { useToast } from './ToastContext';

export type User = {
  _id: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: string;
};

export type Message = {
  _id: string;
  sender: User | string;
  receiver: User | string;
  text: string;
  status: 'sent' | 'delivered' | 'read';
  reactions?: Record<string, string[]>;
  createdAt: string;
};

type ChatContextType = {
  currentUser: User | null;
  users: User[];
  messages: Message[];
  activeChat: string;
  login: (name: string, password: string, avatarUrl?: string) => Promise<void>;
  register: (name: string, password: string, avatarUrl?: string) => Promise<void>;
  logout: () => void;
  sendMessage: (text: string, type?: 'text' | 'voice') => void;
  setActiveChat: (id: string) => void;
  deleteUser: (userId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  isLoading: boolean;
  isInitializing: boolean;
  typingUsers: Record<string, boolean>;
  sendTypingStatus: (receiverId: string, isTyping: boolean) => void;
  unreadCounts: Record<string, number>;
  markAsRead: (userId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('chatUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<string>('global');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('unreadCounts');
    return saved ? JSON.parse(saved) : {};
  });
  const { showToast } = useToast();
  const activeChatRef = useRef(activeChat);
  const currentUserRef = useRef(currentUser);
  const unreadCountsRef = useRef(unreadCounts);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    unreadCountsRef.current = unreadCounts;
  }, [unreadCounts]);

  useEffect(() => {
    localStorage.setItem('unreadCounts', JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  // Request Notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Initialize Socket
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      if (currentUserRef.current) {
        newSocket.emit('join', currentUserRef.current._id);
      }
    });

    newSocket.on('newMessage', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      
      const senderId = String(typeof msg.sender === 'object' ? msg.sender._id : msg.sender);
      const isGlobal = msg.receiver === 'global';
      const isCurrentlyOpen = String(activeChatRef.current) === (isGlobal ? 'global' : senderId);
      const isFromMe = senderId === String(currentUserRef.current?._id);
      
      if (!isFromMe && isCurrentlyOpen) {
        // If we have the chat open, mark as read immediately on the server
        if (!isGlobal) {
          axios.patch(`/api/messages/read/${senderId}`, { receiverId: currentUserRef.current?._id });
        } else {
          localStorage.setItem('lastReadGlobal', new Date().toISOString());
        }
      }

      if (!isFromMe && !isCurrentlyOpen && Notification.permission === 'granted') {
        const senderName = typeof msg.sender === 'object' ? msg.sender.username : 'User';
        new Notification(isGlobal ? 'New Global Message' : `Message from ${senderName}`, {
          body: msg.text,
          icon: typeof msg.sender === 'object' ? msg.sender.avatar : undefined,
          tag: isGlobal ? 'global' : senderId,
          renotify: true
        } as any);
      }
    });

    newSocket.on('reactionUpdate', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    });

    newSocket.on('newUser', (user: User) => {
      setUsers(prev => {
        if (prev.find(u => u._id === user._id)) return prev;
        return [...prev, user];
      });
    });

    newSocket.on('userStatusUpdate', ({ userId, isOnline }) => {
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isOnline } : u));
    });

    newSocket.on('userDeleted', (userId: string) => {
      setUsers(prev => prev.filter(u => u._id !== userId));
      setMessages(prev => prev.filter(m => {
        const sid = typeof m.sender === 'object' ? m.sender._id : m.sender;
        const rid = typeof m.receiver === 'object' ? m.receiver._id : m.receiver;
        return sid !== userId && rid !== userId;
      }));
      if (activeChatRef.current === userId) {
        setActiveChat('global');
      }
    });

    newSocket.on('messageDeleted', (messageId: string) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    newSocket.on('messagesRead', ({ senderId, receiverId }) => {
      if (receiverId === currentUserRef.current?._id) {
        setMessages(prev => prev.map(m => {
          const sid = typeof m.sender === 'object' ? m.sender._id : m.sender;
          if (sid === senderId && m.receiver === receiverId) {
            return { ...m, status: 'read' };
          }
          return m;
        }));
      }
    });

    newSocket.on('userTyping', ({ userId }) => {
      setTypingUsers(prev => ({ ...prev, [userId]: true }));
    });

    newSocket.on('userStoppedTyping', ({ userId }) => {
      setTypingUsers(prev => ({ ...prev, [userId]: false }));
    });

    newSocket.on('messageStatusUpdate', ({ readerId }) => {
      setMessages(prev => prev.map(m => {
        if (m.receiver === readerId && m.status !== 'read') {
          return { ...m, status: 'read' };
        }
        return m;
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, messagesRes] = await Promise.all([
          axios.get('/api/users'),
          axios.get('/api/messages')
        ]);
        setUsers(usersRes.data);
        setMessages(messagesRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        // Add a slight delay for smooth transition
        setTimeout(() => setIsInitializing(false), 800);
      }
    };
    fetchData();
  }, []);

  // Recalculate unread counts from messages (Single Source of Truth)
  useEffect(() => {
    if (currentUser && messages.length >= 0) {
      const counts: Record<string, number> = {};
      const lastReadGlobal = localStorage.getItem('lastReadGlobal') || new Date(0).toISOString();
      
      messages.forEach(msg => {
        const senderId = String(typeof msg.sender === 'object' ? msg.sender._id : msg.sender);
        const isFromMe = senderId === String(currentUser._id);
        
        if (!isFromMe) {
          if (msg.receiver === 'global') {
            if (new Date(msg.createdAt) > new Date(lastReadGlobal)) {
              counts['global'] = (counts['global'] || 0) + 1;
            }
          } else if (msg.receiver === String(currentUser._id) && msg.status !== 'read') {
            counts[senderId] = (counts[senderId] || 0) + 1;
          }
        }
      });
      setUnreadCounts(counts);
    }
  }, [messages, currentUser, activeChat]); // activeChat included to trigger recount on open

  // Mark as read when active chat changes
  useEffect(() => {
    if (currentUser && activeChat) {
      if (activeChat === 'global') {
        localStorage.setItem('lastReadGlobal', new Date().toISOString());
        // Force a recount for global
        setMessages(prev => [...prev]); 
      } else {
        markAsRead(activeChat);
      }
    }
  }, [activeChat, currentUser]);

  // Join room when user logs in
  useEffect(() => {
    if (currentUser && socket) {
      socket.emit('join', currentUser._id);
    }
  }, [currentUser, socket]);

  const login = async (name: string, password: string, avatarUrl?: string) => {
    setIsLoading(true);
    try {
      const avatar = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;
      const res = await axios.post('/api/login', { username: name, password, avatar, mode: 'login' });
      setCurrentUser(res.data);
      sessionStorage.setItem('chatUser', JSON.stringify(res.data));
      showToast(`Welcome back, ${res.data.username}!`, 'success');
    } catch (err: any) {
      console.error('Login failed:', err);
      showToast(err.response?.data?.error || 'Authentication failed', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, password: string, avatarUrl?: string) => {
    setIsLoading(true);
    try {
      const avatar = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;
      await axios.post('/api/login', { username: name, password, avatar, mode: 'signup' });
      showToast("Profile established successfully!", 'success');
    } catch (err: any) {
      console.error('Registration failed:', err);
      showToast(err.response?.data?.error || 'Registration failed', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('chatUser');
  };

  const sendMessage = (text: string, type: 'text' | 'voice' = 'text') => {
    if (!currentUser || !socket) return;
    socket.emit('sendMessage', {
      senderId: currentUser._id,
      receiverId: activeChat,
      text,
      type
    });
  };

  const markAsRead = async (userId: string) => {
    if (!currentUser) return;
    setUnreadCounts(prev => ({ ...prev, [userId]: 0 }));
    
    // Optimistic update
    setMessages(prev => prev.map(m => {
      const sid = typeof m.sender === 'object' ? m.sender._id : m.sender;
      if (sid === userId && m.receiver === currentUser._id) {
        return { ...m, status: 'read' };
      }
      return m;
    }));

    try {
      await axios.patch(`/api/messages/read/${userId}`, { receiverId: currentUser._id });
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await axios.delete(`/api/users/${userId}`);
      showToast("User and conversation deleted", 'success');
    } catch (err) {
      console.error('Delete user failed:', err);
      showToast("Failed to delete user", 'error');
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await axios.delete(`/api/messages/${messageId}`);
      // Optimistic update
      setMessages(prev => prev.filter(m => m._id !== messageId));
    } catch (err) {
      console.error('Delete message failed:', err);
      showToast("Failed to delete message", 'error');
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!currentUser || !socket) return;
    socket.emit('addReaction', { messageId, emoji, userId: currentUser._id });
  };

  const sendTypingStatus = (receiverId: string, isTyping: boolean) => {
    if (!currentUser || !socket || receiverId === 'global') return;
    socket.emit(isTyping ? 'typing' : 'stopTyping', { 
      senderId: currentUser._id, 
      receiverId 
    });
  };

  return (
    <ChatContext.Provider value={{
      currentUser,
      users,
      messages,
      activeChat,
      register,
      login,
      logout,
      sendMessage,
      sendTypingStatus,
      setActiveChat,
      deleteUser,
      deleteMessage,
      isLoading,
      isInitializing,
      typingUsers,
      unreadCounts,
      markAsRead,
      addReaction
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};