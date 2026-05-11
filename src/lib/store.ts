export type User = {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: number;
};

export type MessageStatus = 'sent' | 'delivered' | 'read';

export type Message = {
  id: string;
  senderId: string;
  receiverId: string | 'global';
  text: string;
  timestamp: number;
  status: MessageStatus;
};

// Simulated Database (MongoDB)
export const db = {
  getMessages: (): Message[] => JSON.parse(localStorage.getItem('messages') || '[]'),
  saveMessage: (msg: Message) => {
    const messages = db.getMessages();
    messages.push(msg);
    localStorage.setItem('messages', JSON.stringify(messages));
  },
  updateMessageStatus: (id: string, status: MessageStatus) => {
    const messages = db.getMessages();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      messages[index].status = status;
      localStorage.setItem('messages', JSON.stringify(messages));
    }
  },
  getUsers: (): User[] => JSON.parse(localStorage.getItem('users') || '[]'),
  saveUser: (user: User) => {
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) users[index] = user;
    else users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
  }
};

// Utilities for avatars
export const generateAvatar = (name: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;
};
