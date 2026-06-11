import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Send, User as UserIcon, MessageCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';

interface Contact {
  id: number;
  name: string;
  email: string;
  role: string;
  profilePhoto?: string;
}

interface MessageItem {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
}

export const Messages: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeContactId, setActiveContactId] = useState<number | null>(null);
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await axios.get('/api/messages/contacts');
      return response.data;
    }
  });

  // Fetch chat history between user and active contact
  const { data: history, isLoading: historyLoading } = useQuery<MessageItem[]>({
    queryKey: ['messages', activeContactId],
    queryFn: async () => {
      const response = await axios.get(`/api/messages/${activeContactId}`);
      return response.data;
    },
    enabled: !!activeContactId
  });

  // Listen to incoming sockets and append messages
  useSocket((event, data) => {
    if (event === 'new_message') {
      const { message } = data;
      // If message is from the active contact or sent by me to the active contact, invalidate query
      if (message.senderId === activeContactId || message.receiverId === activeContactId) {
        queryClient.setQueryData(['messages', activeContactId], (old: any) => {
          if (!old) return [message];
          return [...old, message];
        });
      }
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: { receiverId: number; content: string }) => {
      const response = await axios.post('/api/messages', payload);
      return response.data;
    },
    onSuccess: (newMessage) => {
      // Optimistic append or simple query set
      queryClient.setQueryData(['messages', activeContactId], (old: any) => {
        if (!old) return [newMessage];
        return [...old, newMessage];
      });
      setText('');
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeContactId) return;
    sendMessageMutation.mutate({
      receiverId: activeContactId,
      content: text
    });
  };

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const activeContact = contacts?.find(c => c.id === activeContactId);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex h-[75vh] overflow-hidden">
      
      {/* Left panel: Contacts list */}
      <div className="w-1/3 border-r border-slate-100 dark:border-slate-700/60 flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-900/30">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Conversations</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/30 scrollbar-thin">
          {contactsLoading ? (
            <p className="text-slate-400 text-xs text-center py-6">Loading contacts...</p>
          ) : contacts && contacts.length > 0 ? (
            contacts.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveContactId(c.id)}
                className={`w-full p-4 flex items-center space-x-3 text-left transition-colors ${
                  activeContactId === c.id 
                    ? 'bg-primary/5 border-l-4 border-primary' 
                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/10'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center font-bold text-sm">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-slate-700 dark:text-slate-200 truncate">{c.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">{c.role}</p>
                </div>
              </button>
            ))
          ) : (
            <p className="text-slate-400 text-xs text-center py-6">No active contacts.</p>
          )}
        </div>
      </div>

      {/* Right panel: Active Chat Room */}
      <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/10">
        {activeContactId ? (
          <>
            {/* Header info */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center font-bold text-xs">
                {activeContact?.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-700 dark:text-white leading-tight">{activeContact?.name}</h4>
                <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">{activeContact?.role}</span>
              </div>
            </div>

            {/* Message bubble stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {historyLoading ? (
                <p className="text-slate-400 text-xs text-center">Loading conversation...</p>
              ) : (
                history?.map(msg => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div 
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm text-xs leading-relaxed ${
                        isMe 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-slate-700/40'
                      }`}>
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/60 flex items-center space-x-3">
              <input 
                className="flex-1 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                placeholder="Type your message..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <button 
                type="submit" 
                className="p-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md transition-all flex items-center justify-center"
              >
                <Send size={15} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <MessageCircle size={36} className="text-slate-300" />
            <p className="font-semibold text-xs">Select a contact from the list to start chatting.</p>
          </div>
        )}
      </div>

    </div>
  );
};
export default Messages;
