
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Save, User, Shield, RefreshCw, Image as ImageIcon, Palette, ToggleRight, ToggleLeft, Check, Zap } from 'lucide-react';
import { db } from '../services/db';

const Settings: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  // Local state for form
  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState(user?.customTitle || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarSeed, setAvatarSeed] = useState(user?.id || 'seed');
  const [themeColor, setThemeColor] = useState<string>(user?.themeColor || 'cyan');
  const [preferences, setPreferences] = useState(user?.preferences || {
      showOnlineStatus: true,
      publicProfile: true,
      highQualityStreaming: true
  });
  
  const [stats, setStats] = useState({ tracks: 0, streams: 0 });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Real Stats
  useEffect(() => {
      if (user?.id) {
          db.getUserStats(user.id).then(data => setStats(data));
      }
  }, [user]);

  if (!user) {
      navigate('/login');
      return null;
  }

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  const handleSave = () => {
      setIsSaving(true);
      // Simulate delay
      setTimeout(() => {
          updateProfile({ 
              name, 
              customTitle: title,
              bio, 
              avatar: `https://api.dicebear.com/9.x/glass/svg?seed=${avatarSeed}`,
              themeColor: themeColor as 'blue' | 'purple' | 'green' | 'pink' | 'orange' | 'cyan',
              preferences
          });
          setIsSaving(false);
      }, 600);
  };

  const refreshAvatar = () => {
      setAvatarSeed(Math.random().toString(36).substring(7));
  };

  const colors = [
      { id: 'cyan', hex: '#06b6d4', name: 'Cyan' },
      { id: 'purple', hex: '#9333ea', name: 'Purple' },
      { id: 'pink', hex: '#db2777', name: 'Pink' },
      { id: 'green', hex: '#16a34a', name: 'Green' },
      { id: 'orange', hex: '#ea580c', name: 'Orange' },
      { id: 'blue', hex: '#2563eb', name: 'Blue' },
  ];

  const getColorClass = (color: string) => {
      switch(color) {
          case 'purple': return 'text-purple-400 border-purple-400';
          case 'pink': return 'text-pink-400 border-pink-400';
          case 'green': return 'text-green-400 border-green-400';
          case 'orange': return 'text-orange-400 border-orange-400';
          case 'blue': return 'text-blue-400 border-blue-400';
          default: return 'text-cyan-400 border-cyan-400';
      }
  };

  const getBgClass = (color: string) => {
      switch(color) {
          case 'purple': return 'bg-purple-500';
          case 'pink': return 'bg-pink-500';
          case 'green': return 'bg-green-500';
          case 'orange': return 'bg-orange-500';
          case 'blue': return 'bg-blue-500';
          default: return 'bg-cyan-500';
      }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 pt-20 md:pt-10 pb-32">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-4xl font-bold text-white mb-2">Account Settings</h1>
            <p className="text-gray-400">Customize your identity and platform experience.</p>
        </div>
        <div className="flex items-center gap-2">
             <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
                 Version 1.2.0 (Stable)
             </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: PREVIEW CARD */}
          <div className="lg:col-span-4 xl:col-span-3">
              <div className="sticky top-24 space-y-6">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-2">Profile Preview</h3>
                  
                  {/* Preview Card Component */}
                  <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] relative group">
                      {/* Banner */}
                      <div className="h-24 w-full relative">
                          <div className={`absolute inset-0 ${getBgClass(themeColor)} opacity-20`}></div>
                          <img 
                              src={user.bannerUrl || "https://picsum.photos/800/300"} 
                              alt="banner" 
                              className="w-full h-full object-cover opacity-60"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80"></div>
                      </div>

                      <div className="px-6 pb-6 relative z-10 -mt-12 text-center">
                          <div className="relative w-24 h-24 mx-auto mb-3">
                              <div className={`w-full h-full rounded-full overflow-hidden border-2 bg-black p-1 ${getColorClass(themeColor)}`}>
                                  <img 
                                      src={`https://api.dicebear.com/9.x/glass/svg?seed=${avatarSeed}`} 
                                      alt="avatar" 
                                      className="w-full h-full object-cover rounded-full bg-white/10"
                                  />
                              </div>
                              <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-black ${preferences.showOnlineStatus ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                          </div>

                          <h2 className="text-xl font-bold text-white truncate">{name || 'Your Name'}</h2>
                          <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${getColorClass(themeColor).split(' ')[0]}`}>{title || 'Member'}</p>
                          
                          <p className="text-sm text-gray-400 leading-relaxed mb-6 line-clamp-3">
                              {bio || 'No bio provided yet.'}
                          </p>

                          {/* REAL STATS GRID - Fixed Layout */}
                          <div className="flex justify-between border-t border-white/10 pt-4">
                               <div className="text-center flex-1 px-1">
                                   <span className="block text-white font-bold text-lg">{stats.tracks}</span>
                                   <span className="text-[10px] text-gray-500 uppercase tracking-wide">Tracks</span>
                               </div>
                               <div className="text-center flex-1 px-1 border-l border-white/10">
                                   {/* Followers are 0 because feature is not implemented, keeping data real. */}
                                   <span className="block text-white font-bold text-lg">0</span>
                                   <span className="text-[10px] text-gray-500 uppercase tracking-wide">Followers</span>
                               </div>
                               <div className="text-center flex-1 px-1 border-l border-white/10">
                                   <span className="block text-white font-bold text-lg">{stats.streams}</span>
                                   <span className="text-[10px] text-gray-500 uppercase tracking-wide">Streams</span>
                               </div>
                          </div>
                      </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="bg-gradient-to-r from-gray-900 to-black border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                              <Zap size={18} />
                          </div>
                          <div>
                              <p className="text-sm font-bold text-white">Full Access</p>
                              <p className="text-xs text-gray-500">No restrictions active</p>
                          </div>
                      </div>
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
              </div>
          </div>

          {/* RIGHT COLUMN: EDITOR */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
              
              {/* Section 1: Identity */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <User size={20} className="text-gray-400" />
                      Identity
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Display Name</label>
                          <input 
                              type="text" 
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Custom Title / Role</label>
                          <input 
                              type="text" 
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="e.g. Producer, DJ, Curator"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                          />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bio</label>
                          <textarea 
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              rows={3}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors resize-none"
                              placeholder="Tell the community about your sound..."
                          />
                      </div>
                  </div>
              </div>

              {/* Section 2: Visuals */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Palette size={20} className="text-gray-400" />
                      Visuals & Theme
                  </h3>

                  <div className="space-y-8">
                       {/* Avatar & Banner */}
                       <div className="flex flex-col md:flex-row gap-6">
                           <div className="flex-1 space-y-4">
                               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Profile Avatar</label>
                               <div className="flex items-center gap-4">
                                   <div className="w-16 h-16 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                                       <img src={`https://api.dicebear.com/9.x/glass/svg?seed=${avatarSeed}`} alt="seed" className="w-full h-full object-cover" />
                                   </div>
                                   <button onClick={refreshAvatar} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white flex items-center gap-2 transition-colors">
                                       <RefreshCw size={14} /> Randomize
                                   </button>
                               </div>
                           </div>
                           <div className="flex-1 space-y-4">
                               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Banner Image</label>
                               <div className="h-16 w-full rounded-xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors border-dashed">
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <ImageIcon size={16} />
                                        <span>Upload New Banner</span>
                                    </div>
                               </div>
                           </div>
                       </div>

                       {/* Accent Color */}
                       <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Interface Accent Color</label>
                            <div className="flex flex-wrap gap-3">
                                {colors.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setThemeColor(c.id)}
                                        className={`
                                            w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2
                                            ${themeColor === c.id ? 'border-white scale-110' : 'border-transparent hover:scale-105'}
                                        `}
                                        style={{ backgroundColor: c.hex }}
                                        title={c.name}
                                    >
                                        {themeColor === c.id && <Check size={16} className="text-white drop-shadow-md" />}
                                    </button>
                                ))}
                            </div>
                       </div>
                  </div>
              </div>

              {/* Section 3: Privacy & Preferences */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Shield size={20} className="text-gray-400" />
                      Privacy & Experience
                  </h3>

                  <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                          <div>
                              <p className="text-white font-bold text-sm">Show Online Status</p>
                              <p className="text-gray-500 text-xs mt-1">Allow other users to see when you are active in chat.</p>
                          </div>
                          <button 
                            onClick={() => setPreferences(p => ({...p, showOnlineStatus: !p.showOnlineStatus}))}
                            className={`transition-colors ${preferences.showOnlineStatus ? 'text-green-400' : 'text-gray-600'}`}
                          >
                              {preferences.showOnlineStatus ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                          </button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                          <div>
                              <p className="text-white font-bold text-sm">Public Profile</p>
                              <p className="text-gray-500 text-xs mt-1">Your profile card is visible to the community.</p>
                          </div>
                          <button 
                            onClick={() => setPreferences(p => ({...p, publicProfile: !p.publicProfile}))}
                            className={`transition-colors ${preferences.publicProfile ? 'text-green-400' : 'text-gray-600'}`}
                          >
                              {preferences.publicProfile ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                          </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                          <div>
                              <p className="text-white font-bold text-sm">High Quality Streaming (FLAC)</p>
                              <p className="text-gray-500 text-xs mt-1">Disable to save bandwidth (falls back to MP3 if available).</p>
                          </div>
                          <button 
                            onClick={() => setPreferences(p => ({...p, highQualityStreaming: !p.highQualityStreaming}))}
                            className={`transition-colors ${preferences.highQualityStreaming ? 'text-green-400' : 'text-gray-600'}`}
                          >
                              {preferences.highQualityStreaming ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                          </button>
                      </div>
                  </div>
              </div>

              {/* Save / Logout Actions */}
              <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-6 pt-4">
                   <button 
                      onClick={handleLogout}
                      className="px-6 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                      <LogOut size={18} />
                      Log Out
                  </button>

                  <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                      {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                      Save Changes
                  </button>
              </div>

          </div>
      </div>
    </div>
  );
};

export default Settings;
