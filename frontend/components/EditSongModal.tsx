import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Song } from '../types';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';

interface EditSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  onSongUpdated: (updatedSong: Song) => void;
}

const EditSongModal: React.FC<EditSongModalProps> = ({ isOpen, onClose, song, onSongUpdated }) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [lyrics, setLyrics] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (song) {
      setTitle(song.title);
      setArtist(song.artist);
      setAlbum(song.album || '');
      setLyrics(song.lyrics || '');
    }
  }, [song]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (song && user) {
      try {
        const updatedSong = await db.editSong(song.id, user.id, { title, artist, album, lyrics });
        onSongUpdated(updatedSong);
        onClose();
      } catch (error: any) {
        alert(error?.message || "Failed to update song. Please try again.");
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Song">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-400">Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white" 
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400">Artist</label>
            <input 
              type="text" 
              value={artist} 
              onChange={e => setArtist(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white" 
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400">Album</label>
            <input 
              type="text" 
              value={album} 
              onChange={e => setAlbum(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white" 
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400">Lyrics</label>
            <textarea 
              value={lyrics} 
              onChange={e => setLyrics(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white h-32" 
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 text-white">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-white text-black font-bold">Save</button>
        </div>
      </form>
    </Modal>
  );
};

export default EditSongModal;
