import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Song, Message } from '../types';
import { useAuth } from '../context/AuthContext';
import { Trash2, Loader2, Search, Edit, BarChart3, Music, MessageSquare, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import EditSongModal from '../components/EditSongModal';
import EditMessageModal from '../components/EditMessageModal';

const Admin: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'songs' | 'messages'>('songs');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isEditSongModalOpen, setIsEditSongModalOpen] = useState(false);
  const [isEditMessageModalOpen, setIsEditMessageModalOpen] = useState(false);
  const { user } = useAuth();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [songData, messageData] = await Promise.all([
        db.getAllSongs(),
        db.getMessages()
      ]);
      setSongs(songData || []);
      setMessages(messageData || []);
    } catch (err: any) {
      console.error('Failed to load admin data', err);
      setError(err?.message || 'Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) {
      loadData();
    }
  }, [user]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const handleDeleteSong = async (songId: string) => {
    if (!user?.isAdmin) {
      showError('Unauthorized: Admin access required');
      return;
    }

    setLoadingStates(prev => ({ ...prev, [songId]: true }));
    try {
      if (window.confirm('Are you sure you want to delete this song? This action cannot be undone.')) {
        await db.deleteSong(songId, user.id);
        showSuccess('Song deleted successfully');
        await loadData();
      }
    } catch (err: any) {
      showError(err?.message || 'Failed to delete song. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [songId]: false }));
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user?.isAdmin) {
      showError('Unauthorized: Admin access required');
      return;
    }

    setLoadingStates(prev => ({ ...prev, [messageId]: true }));
    try {
      if (window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
        await db.deleteMessage(messageId, user.id);
        showSuccess('Message deleted successfully');
        await loadData();
      }
    } catch (err: any) {
      showError(err?.message || 'Failed to delete message. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [messageId]: false }));
    }
  };

  const handleEditSong = (song: Song) => {
    setSelectedSong(song);
    setIsEditSongModalOpen(true);
  };

  const handleEditMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsEditMessageModalOpen(true);
  };

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.album?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter(message =>
    message.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalSongs: songs.length,
    totalMessages: messages.length,
    totalUsers: new Set([...songs.map(s => s.uploaderId), ...messages.map(m => m.userId)].filter(Boolean)).size,
    totalPlays: songs.reduce((sum, song) => sum + (song.plays || 0), 0)
  };

  if (!user?.isAdmin) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You must be an administrator to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">Admin Panel</h1>
        <p className="text-gray-400">Manage songs, messages, and platform content</p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3">
          <CheckCircle className="text-green-400" size={20} />
          <p className="text-green-400">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3">
          <XCircle className="text-red-400" size={20} />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Music className="text-blue-400" size={24} />
            <h3 className="text-sm font-bold text-gray-400 uppercase">Total Songs</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalSongs}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="text-purple-400" size={24} />
            <h3 className="text-sm font-bold text-gray-400 uppercase">Total Messages</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalMessages}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-green-400" size={24} />
            <h3 className="text-sm font-bold text-gray-400 uppercase">Active Users</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="text-yellow-400" size={24} />
            <h3 className="text-sm font-bold text-gray-400 uppercase">Total Plays</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalPlays}</p>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
          />
        </div>
        <div className="flex gap-2 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => { setActiveTab('songs'); setSearchTerm(''); }}
            className={`px-6 py-2 rounded-lg transition-colors ${
              activeTab === 'songs' 
                ? 'bg-white text-black font-bold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Songs
          </button>
          <button
            onClick={() => { setActiveTab('messages'); setSearchTerm(''); }}
            className={`px-6 py-2 rounded-lg transition-colors ${
              activeTab === 'messages' 
                ? 'bg-white text-black font-bold' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Messages
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'songs' ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6 text-white">Songs</h2>
          {filteredSongs.length === 0 ? (
            <div className="text-center py-12">
              <Music className="mx-auto text-gray-500 mb-4" size={48} />
              <p className="text-gray-400">
                {searchTerm ? 'No songs found matching your search.' : 'No songs available.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSongs.map(song => (
                <div key={song.id} className="bg-black/40 p-4 rounded-lg flex justify-between items-center hover:bg-black/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{song.title}</p>
                    <p className="text-sm text-gray-400 truncate">{song.artist} {song.album && `• ${song.album}`}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>{song.plays || 0} plays</span>
                      <span>{song.format || 'FLAC'}</span>
                      {song.bitrate && <span>{song.bitrate} kbps</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditSong(song)}
                      className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                      title="Edit Song"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSong(song.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      disabled={loadingStates[song.id]}
                      title="Delete Song"
                    >
                      {loadingStates[song.id] ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6 text-white">Messages</h2>
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto text-gray-500 mb-4" size={48} />
              <p className="text-gray-400">
                {searchTerm ? 'No messages found matching your search.' : 'No messages available.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map(message => (
                <div key={message.id} className="bg-black/40 p-4 rounded-lg flex justify-between items-start hover:bg-black/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-white mb-1">{message.text}</p>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span className="font-semibold">{message.userName}</span>
                      <span>{new Date(message.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditMessage(message)}
                      className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                      title="Edit Message"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      disabled={loadingStates[message.id]}
                      title="Delete Message"
                    >
                      {loadingStates[message.id] ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modals */}
      <EditSongModal
        isOpen={isEditSongModalOpen}
        onClose={() => {
          setIsEditSongModalOpen(false);
          setSelectedSong(null);
        }}
        song={selectedSong}
        onSongUpdated={async (updatedSong) => {
          showSuccess('Song updated successfully');
          await loadData();
        }}
      />
      <EditMessageModal
        isOpen={isEditMessageModalOpen}
        onClose={() => {
          setIsEditMessageModalOpen(false);
          setSelectedMessage(null);
        }}
        message={selectedMessage}
        onMessageUpdated={async (updatedMessage) => {
          showSuccess('Message updated successfully');
          await loadData();
        }}
      />
    </div>
  );
};

export default Admin;
