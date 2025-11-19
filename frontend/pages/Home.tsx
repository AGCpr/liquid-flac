import React, { useEffect, useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { db } from '../services/db';
import LiquidCard from '../components/LiquidCard';
import { Play, Pause, Activity, Loader2, Info, Edit, Trash2 } from 'lucide-react';
import { PlayState, Song } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EditSongModal from '../components/EditSongModal';

const Home: React.FC = () => {
  const { playSong, currentSong, playState } = useAudio();
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  useEffect(() => {
    const loadSongs = async () => {
        try {
            setError(null);
            const data = await db.getAllSongs();
            setSongs(data);
        } catch (error: any) {
            console.error("Failed to load songs", error);
            setError(error?.message || "Failed to load songs. Please refresh the page.");
        } finally {
            setLoading(false);
        }
    };
    loadSongs();
  }, []);

  const formatTime = (seconds: number) => {
      if (!seconds || isNaN(seconds)) return "0:00";
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
      return (
          <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-white" size={48} />
          </div>
      );
  }

  if (error) {
      return (
          <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
              <p className="text-red-400 text-lg">{error}</p>
              <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors"
              >
                  Refresh Page
              </button>
          </div>
      );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="mb-12 mt-10 md:mt-0 relative">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
          Liquid Library
        </h1>
        <p className="text-gray-400 mt-2 tracking-wide font-light">High-Fidelity FLAC Streaming</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {songs.map((song) => {
            const isPlayingThis = currentSong?.id === song.id && playState === PlayState.PLAYING;
            const qualityBadge = song.bitrate && song.bitrate > 900 ? 'HI-RES' : 'STD';
            const qualityColor = song.bitrate && song.bitrate > 900 ? 'text-yellow-400 border-yellow-400/20' : 'text-gray-300 border-white/10';
            
            return (
                <LiquidCard key={song.id} className="h-96 w-full" onClick={() => playSong(song)}>
                    <div className="flex flex-col h-full p-5 relative z-20">
                        {/* Card Header */}
                        <div className="flex justify-between items-start">
                            <div className={`px-3 py-1 rounded-full border bg-black/20 backdrop-blur-md text-[10px] tracking-widest uppercase ${qualityColor}`}>
                                {song.format || 'FLAC'}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {currentSong?.id === song.id && (
                                    <div className="text-green-400 animate-pulse">
                                        <Activity size={16} />
                                    </div>
                                )}
                                {/* Detail Info Button */}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/song/${song.id}`);
                                    }}
                                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white transition-colors backdrop-blur-sm"
                                    title="View Details"
                                >
                                    <Info size={14} />
                                </button>
                                {user && user.id === song.uploaderId && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSong(song);
                                        setIsEditModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-full bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white transition-colors backdrop-blur-sm"
                                      title="Edit Song"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Are you sure you want to delete this song?')) {
                                          try {
                                            await db.deleteSong(song.id, user.id);
                                            setSongs(songs.filter(s => s.id !== song.id));
                                          } catch (error: any) {
                                            alert(error?.message || "Failed to delete song. Please try again.");
                                          }
                                        }
                                      }}
                                      className="p-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-white transition-colors backdrop-blur-sm"
                                      title="Delete Song"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                            </div>
                        </div>

                        {/* Album Art */}
                        <div className="flex-1 flex items-center justify-center my-4 relative group">
                            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white/5 shadow-[0_0_30px_rgba(255,255,255,0.05)] relative z-10">
                                <img 
                                    src={song.coverUrl} 
                                    alt={song.title} 
                                    className={`w-full h-full object-cover transition-transform duration-[3s] ease-linear ${isPlayingThis ? 'animate-[spin_8s_linear_infinite]' : ''}`} 
                                />
                                {/* Vinyl Hole */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full border border-gray-800"></div>
                            </div>
                            
                            {/* Play Overlay on Hover */}
                            <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                                     {isPlayingThis ? <Pause fill="white" /> : <Play fill="white" className="ml-1"/>}
                                </div>
                            </div>
                        </div>

                        {/* Meta */}
                        <div className="mt-auto">
                            <h3 className="text-xl font-semibold text-white truncate">{song.title}</h3>
                            <p className="text-sm text-gray-400 mt-1">{song.artist}</p>
                            <div className="w-full h-[1px] bg-white/10 mt-4"></div>
                            <div className="flex justify-between mt-3 text-xs text-gray-500 font-mono">
                                <span>{formatTime(song.duration)}</span>
                                <span>
                                    {song.sampleRate ? (song.sampleRate / 1000) + 'kHz' : '44.1kHz'}
                                    {' / '}
                                    {song.bitrate ? song.bitrate + 'kbps' : '24bit'}
                                </span>
                            </div>
                        </div>
                    </div>
                </LiquidCard>
            )
        })}
      </div>
      <div className="h-32"></div> {/* Spacer for bottom player */}
      <EditSongModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        song={selectedSong}
        onSongUpdated={(updatedSong) => {
          setSongs(songs.map(s => s.id === updatedSong.id ? updatedSong : s));
        }}
      />
    </div>
  );
};

export default Home;