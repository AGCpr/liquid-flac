import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../services/db';
import { Message, Song, User } from '../types';
import { Send, Music, Loader2, Users, MessageSquare, Hash, User as UserIcon, Edit, Trash2 } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import EditMessageModal from '../components/EditMessageModal';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const { playSong } = useAudio();
  
  // User Identity & Presence from Global Context
  const { user, isAuthenticated } = useAuth();
  const currentUser = user; 

  const [activePeers, setActivePeers] = useState<Map<string, User & { lastSeen: number }>>(new Map());

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const loadData = async () => {
      try {
          const msgs = await db.getMessages();
          const songList = await db.getAllSongs();
          setMessages(msgs);
          setSongs(songList);
      } catch (error: any) {
          console.error("Failed to load chat data", error);
          alert(error?.message || "Failed to load messages. Please refresh the page.");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
      if (!loading) {
          scrollToBottom();
      }
  }, [messages.length, loading]);

  // Real-time Presence System with localStorage
  useEffect(() => {
      if (!currentUser) return;

      // Store current user info in localStorage with a timestamp
      const updateUserPresence = () => {
          const userPresence = {
              id: currentUser.id,
              name: currentUser.name,
              avatar: currentUser.avatar,
              timestamp: Date.now()
          };
          localStorage.setItem('liquid_flac_user', JSON.stringify(userPresence));
      };
      
      updateUserPresence();
      
      // Check for other active users
      const checkActiveUsers = () => {
          const users: User[] = [];
          for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('liquid_flac_user_')) {
                  try {
                      const userData = JSON.parse(localStorage.getItem(key) || '{}');
                      // If user was active in the last 10 seconds
                      if (Date.now() - userData.timestamp < 10000 && userData.id && userData.name && userData.avatar) {
                          users.push({
                              id: userData.id,
                              name: userData.name,
                              avatar: userData.avatar,
                              isAdmin: false
                          });
                      }
                  } catch (e) {
                      console.error('Error parsing user data', e);
                  }
              }
          }
          
          setActivePeers(prev => {
              const newMap = new Map(prev);
              users.forEach(user => {
                  if (user.id !== currentUser.id) {
                      newMap.set(user.id, { ...user, lastSeen: Date.now() });
                  }
              });
              return newMap;
          });
      };

      // Update presence every 5 seconds
      const presenceInterval = setInterval(updateUserPresence, 5000);
      // Check for active users every 2 seconds
      const activeUsersInterval = setInterval(checkActiveUsers, 2000);
      
      return () => {
          clearInterval(presenceInterval);
          clearInterval(activeUsersInterval);
      };
  }, [currentUser]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      text: inputText,
      timestamp: Date.now(),
    };

    setInputText('');
    try {
      await db.addMessage(newMessage);
      loadData();
      scrollToBottom('smooth');
    } catch (error: any) {
      alert(error?.message || "Failed to send message. Please try again.");
      setInputText(newMessage.text); // Restore the message text
    }
  };

  const handleSongClick = (songId: string) => {
      const song = songs.find(s => s.id === songId);
      if (song) playSong(song);
  };

  const stats = useMemo(() => {
      const uniqueUsers = new Set(messages.map(m => m.userId)).size;
      const onlineCount = activePeers.size + (currentUser ? 1 : 0);
      return { totalMessages: messages.length, uniqueContributors: uniqueUsers, onlineCount };
  }, [messages, activePeers, currentUser]);

  const activeUsersList = Array.from(activePeers.values());

  if (loading) {
      return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>
  }

  return (
    // Fixed height container to fit exactly in the main area without causing double scroll
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-6rem)] flex flex-col max-w-6xl mx-auto">
            
            {/* Real Statistics Header */}
            <div className="flex-none p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-black/20 backdrop-blur-sm z-10">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Global Chat
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-gray-400 font-mono border border-white/5">#MAIN</span>
                    </h2>
                    
                    {/* Active User List */}
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex -space-x-2 overflow-hidden p-1 min-h-[32px]">
                            {currentUser && (
                                <div className="relative group/avatar z-30">
                                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-black bg-white/10 object-cover" src={currentUser.avatar} alt={currentUser.name} />
                                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-black bg-green-400"></div>
                                </div>
                            )}
                            {activeUsersList.map((peer, i) => (
                                <div key={peer.id} className="relative z-20">
                                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-black bg-white/10 object-cover grayscale-[30%]" src={peer.avatar} alt={peer.name} />
                                </div>
                            ))}
                        </div>
                        <span className="text-xs text-green-400 font-mono animate-pulse">
                            {stats.onlineCount} Online
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages Area - Scrollable Flex Item */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative">
                {messages.map((msg, idx) => {
                    const isMe = currentUser && msg.userId === currentUser.id;
                    const linkedSong = msg.songRef ? songs.find(s => s.id === msg.songRef) : null;
                    const isSystemMock = msg.userId === 'u1'; 
                    
                    // Grouping logic: Check if previous message was from same user within 2 mins
                    const prevMsg = messages[idx - 1];
                    const isSequence = prevMsg && prevMsg.userId === msg.userId && (msg.timestamp - prevMsg.timestamp < 120000);

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-3 ${isSequence ? 'mt-1' : 'mt-4'}`}>
                            {!isMe && !isSequence && (
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0 overflow-hidden mb-1 shadow-md">
                                    <img 
                                        src={`https://api.dicebear.com/9.x/glass/svg?seed=${msg.userId}`} 
                                        alt="avatar" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            {!isMe && isSequence && <div className="w-8 flex-shrink-0" />}

                            <div className={`max-w-[85%] md:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && !isSequence && <span className="text-[11px] text-gray-500 ml-1 mb-1">{msg.userName}</span>}
                                
                                <div className={`
                                    relative px-5 py-3 shadow-lg backdrop-blur-md border border-white/5
                                    ${isMe 
                                        ? 'bg-blue-600/20 text-white rounded-2xl rounded-tr-none border-blue-500/30' 
                                        : 'bg-white/10 text-gray-100 rounded-2xl rounded-tl-none'
                                    }
                                `}>
                                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    
                                    {linkedSong && (
                                        <div 
                                            onClick={() => handleSongClick(linkedSong.id)}
                                            className="mt-3 flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/5 transition-colors group"
                                        >
                                            <img src={linkedSong.coverUrl} className="w-10 h-10 rounded-lg bg-gray-800 object-cover shadow-sm" alt="art" />
                                            <div className="overflow-hidden min-w-0">
                                                <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">{linkedSong.title}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{linkedSong.artist}</p>
                                            </div>
                                            <Music size={14} className="ml-auto text-gray-500" />
                                        </div>
                                    )}
                                    
                                    <span className="text-[9px] opacity-40 absolute bottom-1 right-2.5 mt-1">
                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                {isMe && (
                                  <div className="flex gap-2 mt-1">
                                    <button
                                      onClick={() => {
                                        setSelectedMessage(msg);
                                        setIsEditModalOpen(true);
                                      }}
                                      className="text-gray-400 hover:text-white"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm("Are you sure you want to delete this message?")) {
                                          if (currentUser) {
                                            db.deleteMessage(msg.id, currentUser.id).then(loadData);
                                          }
                                        }
                                      }}
                                      className="text-gray-400 hover:text-red-400"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at bottom of container */}
            <div className="flex-none p-4 md:p-6 bg-gradient-to-t from-black to-transparent z-20">
                {currentUser ? (
                    <form onSubmit={handleSend} className="relative group max-w-4xl mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative flex items-center bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden focus-within:border-white/30 transition-all shadow-2xl">
                            <input 
                                type="text" 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={`Message as ${currentUser.name}...`} 
                                className="w-full bg-transparent border-none text-white placeholder-gray-500 px-6 py-4 focus:outline-none focus:ring-0 text-base"
                            />
                            <button 
                                type="submit"
                                className="p-4 text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50 border-l border-white/5"
                                disabled={!inputText.trim()}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center backdrop-blur-md">
                        <p className="text-gray-400 text-sm mb-2">Join the community to start chatting.</p>
                        <Link to="/login" className="inline-block px-6 py-2 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors">
                            Log In or Register
                        </Link>
                    </div>
                )}
            </div>
      <EditMessageModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        message={selectedMessage}
        onMessageUpdated={(updatedMessage) => {
          setMessages(messages.map(m => m.id === updatedMessage.id ? updatedMessage : m));
        }}
      />
    </div>
  );
};

export default Chat;
