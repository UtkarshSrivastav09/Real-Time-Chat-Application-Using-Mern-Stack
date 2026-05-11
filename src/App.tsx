import React, { useEffect } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import { ToastProvider } from './context/ToastContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { cn } from './utils/cn';
import { motion } from 'framer-motion';

const SplashScreen: React.FC = () => (
  <div className="fixed inset-0 bg-[#0b141a] z-[100] flex flex-col items-center justify-center">
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-[#00a884] rounded-[24px] rotate-12 flex items-center justify-center shadow-[0_0_50px_rgba(0,168,132,0.3)]">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
        <div className="absolute inset-0 bg-[#00a884] rounded-[24px] blur-2xl opacity-20 animate-pulse" />
      </div>
      
      <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Nexus Professional</h2>
      <div className="flex items-center space-x-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: '0.2s' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce" style={{ animationDelay: '0.4s' }} />
      </div>
    </motion.div>
    
    <div className="absolute bottom-12 text-[#3b4a54] text-[10px] uppercase tracking-[0.3em] font-black">
      Synchronizing Workspace
    </div>
  </div>
);

const MainLayout: React.FC = () => {
  const { currentUser, activeChat, isInitializing } = useChat();

  // Update document title
  useEffect(() => {
    if (currentUser) {
      document.title = `${currentUser.username} | Nexus Professional`;
    } else {
      document.title = 'Nexus Chat | Real-Time Messaging';
    }
  }, [currentUser]);

  if (isInitializing) return <SplashScreen />;
  if (!currentUser) return <Login />;

  const isHome = activeChat === 'global' || !activeChat;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-screen bg-[#0b141a] md:p-4 lg:p-6 justify-center overflow-hidden font-sans"
    >
      <div className="flex w-full max-w-[1600px] h-full bg-[#111b21] md:rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/5 relative">
        
        {/* Sidebar - Hidden on mobile if a specific chat is active */}
        <div className={cn(
          "w-full md:w-[400px] h-full border-r border-white/5 z-20 bg-[#111b21]",
          !isHome ? "hidden md:block" : "block"
        )}>
          <Sidebar />
        </div>
        
        {/* Chat Area - Hidden on mobile if looking at the chat list */}
        <div className={cn(
          "flex-1 h-full z-10",
          isHome ? "hidden md:block" : "block"
        )}>
          <ChatArea />
        </div>

      </div>
    </motion.div>
  );
};

function App() {
  return (
    <ToastProvider>
      <ChatProvider>
        <MainLayout />
      </ChatProvider>
    </ToastProvider>
  );
}

export default App;