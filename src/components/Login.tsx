import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { MessageSquare, Shield, Zap, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export const Login: React.FC = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const { login, register, isLoading } = useChat();

  const avatars = [
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Buddy&backgroundColor=d1d4f9`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Caspian&backgroundColor=ffdfbf`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Daisy&backgroundColor=ffd5dc`,
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && password.trim()) {
      try {
        if (mode === 'signup') {
          await register(name.trim(), password.trim(), avatars[selectedAvatar]);
          setMode('login');
          setPassword(''); // Clear password for security
        } else {
          await login(name.trim(), password.trim(), avatars[selectedAvatar]);
        }
      } catch (err) {
        // Error is already handled with alerts in ChatContext
      }
    }
  };

  const featureHighlights = [
    { icon: <Zap className="w-5 h-5" />, title: "Real-time Sync", desc: "Instant message delivery across all devices." },
    { icon: <Shield className="w-5 h-5" />, title: "Secure Data", desc: "Encrypted transmission via Socket.io." },
    { icon: <Globe className="w-5 h-5" />, title: "Global Reach", desc: "Connect with anyone in our global lobby." }
  ];

  return (
    <div className="min-h-screen bg-[#0b141a] relative overflow-y-auto font-sans flex flex-col">
      {/* Premium Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop")' }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#0b141a] via-transparent to-[#00a884]/10" />

      {/* Animated Floating Shapes - Fixed */}
      <motion.div 
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="fixed top-1/4 left-1/4 w-64 h-64 bg-[#00a884]/10 rounded-full blur-[100px]"
      />
      <motion.div 
        animate={{ y: [0, 20, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-[#00a884]/5 rounded-full blur-[120px]"
      />

      <div className="relative z-10 w-full min-h-screen flex items-center justify-center p-4 md:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[950px] bg-[#111b21]/90 backdrop-blur-3xl rounded-[32px] md:rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] flex flex-col md:flex-row overflow-hidden border border-white/10"
        >
        {/* Left Side - Visual Branding */}
        <div className="flex-1 p-10 md:p-12 flex flex-col justify-between bg-gradient-to-b from-[#111b21] to-[#0b141a] border-r border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,#00a884_0%,transparent_70%)]" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-10">
              <div className="p-2.5 bg-gradient-to-br from-[#00a884] to-[#008f72] rounded-xl shadow-[0_0_15px_rgba(0,168,132,0.3)]">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Nexus</h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#00a884] font-black">Professional</p>
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-8 bg-gradient-to-r from-white to-[#8696a0] bg-clip-text text-transparent">
              Next-Gen Messaging <br /> For Professionals.
            </h2>
            
            <div className="space-y-6">
              {featureHighlights.map((feature, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  key={i} 
                  className="flex items-center space-x-4 group cursor-default"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#00a884] group-hover:bg-[#00a884] group-hover:text-white transition-all duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-[#e9edef] font-semibold">{feature.title}</h3>
                    <p className="text-xs text-[#8696a0]">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-8 flex items-center justify-between border-t border-white/5">
             <div className="flex items-center space-x-2 text-[11px] text-[#8696a0]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
                <span>Systems Active</span>
             </div>
             <p className="text-[9px] text-[#8696a0] uppercase tracking-widest">v2.4.0 Stable</p>
          </div>
        </div>

        {/* Right Side - Authentication Form */}
        <div className="w-full md:w-[450px] p-10 md:p-12 flex flex-col justify-center items-center bg-[#111b21]/50 relative">
          <div className="w-full max-w-sm">
            <div className="text-center mb-10">
              <h3 className="text-xl font-bold text-white mb-2">
                {mode === 'login' ? 'Welcome Back' : 'Join the Network'}
              </h3>
              <p className="text-xs text-[#8696a0]">
                {mode === 'login' ? 'Sign in to your workspace' : 'Create your profile'}
              </p>
            </div>

            {/* Avatar Picker */}
            <div className="mb-8">
              <p className="text-[10px] font-bold text-[#8696a0] uppercase tracking-widest text-center mb-4">Choose Identity</p>
              <div className="flex justify-center -space-x-1.5">
                {avatars.map((url, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.1, zIndex: 20 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedAvatar(idx)}
                    className={cn(
                      "relative cursor-pointer transition-all duration-300",
                      selectedAvatar === idx ? "z-10 scale-110" : "hover:z-10"
                    )}
                  >
                    <img 
                      src={url}
                      alt="Avatar"
                      className={cn(
                        "w-12 h-12 rounded-full border-[3px] transition-all duration-300 shadow-xl",
                        selectedAvatar === idx ? "border-[#00a884] rotate-0" : "border-[#111b21] grayscale opacity-40 -rotate-12 hover:rotate-0 hover:grayscale-0 hover:opacity-100"
                      )}
                    />
                    {selectedAvatar === idx && (
                      <motion.div 
                        layoutId="active-avatar-glow"
                        className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(0,168,132,0.5)]" 
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-[#8696a0] uppercase tracking-widest ml-1">Workspace Name</label>
                <div className="relative group">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Utkarsh Srivastav"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00a884] focus:ring-4 focus:ring-[#00a884]/10 transition-all placeholder:text-[#3b4a54] text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-[#8696a0] uppercase tracking-widest ml-1">Access Key</label>
                <div className="relative group">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00a884] focus:ring-4 focus:ring-[#00a884]/10 transition-all placeholder:text-[#3b4a54] text-sm"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading || !name.trim() || !password.trim()}
                className="group w-full bg-gradient-to-r from-[#00a884] to-[#00c9a0] disabled:from-gray-700 disabled:to-gray-800 text-[#111b21] font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg flex items-center justify-center space-x-2 text-base mt-2"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-[#111b21]/20 border-t-[#111b21] rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Authenticate' : 'Establish Profile'}</span>
                    <Zap className="w-5 h-5 group-hover:scale-125 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
                <button 
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-sm text-[#00a884] hover:text-[#00c9a0] transition-colors font-medium border-b border-transparent hover:border-[#00a884]"
                >
                    {mode === 'login' ? "Access new workspace? Create profile" : "Existing workspace? Authenticate here"}
                </button>
            </div>

            <div className="mt-10 flex items-center justify-center space-x-6 text-[#3b4a54]">
               <a href="#" className="hover:text-[#8696a0] transition-colors text-[9px] uppercase tracking-widest font-bold">Privacy</a>
               <div className="w-1 h-1 bg-[#3b4a54] rounded-full" />
               <a href="#" className="hover:text-[#8696a0] transition-colors text-[9px] uppercase tracking-widest font-bold">License</a>
               <div className="w-1 h-1 bg-[#3b4a54] rounded-full" />
               <a href="#" className="hover:text-[#8696a0] transition-colors text-[9px] uppercase tracking-widest font-bold">API</a>
            </div>
          </div>
        </div>
        </motion.div>
      </div>

      {/* Modern Footer */}
      <footer className="mt-12 text-[#3b4a54] text-xs font-medium tracking-tight z-10 flex items-center space-x-2">
        <span>© 2024 Nexus Intelligence Systems</span>
        <div className="w-1 h-1 bg-[#3b4a54] rounded-full" />
        <span className="flex items-center">
           Made with <span className="text-red-500 mx-1">❤</span> in MERN
        </span>
      </footer>
    </div>
  );
};