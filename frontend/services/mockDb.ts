import { Song, Message } from '../types';
import { MOCK_SONGS, MOCK_MESSAGES } from './mockData';

class MockDB {
  private songs: Song[] = [...MOCK_SONGS];
  private messages: Message[] = [...MOCK_MESSAGES];

  async getAllSongs(): Promise<Song[]> {
    // Return a deep copy to simulate DB fetch
    return JSON.parse(JSON.stringify(this.songs));
  }

  async getSongById(id: string): Promise<Song | null> {
    const song = this.songs.find(s => s.id === id);
    return song ? JSON.parse(JSON.stringify(song)) : null;
  }

  async addSong(song: Omit<Song, 'id' | 'createdAt'>): Promise<Song> {
    const newSong: Song = {
      ...song,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    this.songs.unshift(newSong);
    return JSON.parse(JSON.stringify(newSong));
  }

  async editSong(id: string, userId: string, updates: Partial<Song>): Promise<Song> {
    const index = this.songs.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Song not found');
    
    this.songs[index] = { ...this.songs[index], ...updates };
    return JSON.parse(JSON.stringify(this.songs[index]));
  }

  async deleteSong(id: string, userId: string): Promise<void> {
    this.songs = this.songs.filter(s => s.id !== id);
  }

  async incrementPlays(id: string): Promise<void> {
    const song = this.songs.find(s => s.id === id);
    if (song) {
      song.plays = (song.plays || 0) + 1;
    }
  }

  async getUserStats(userId: string): Promise<{ tracks: number; streams: number }> {
    const userSongs = this.songs.filter(s => s.uploaderId === userId);
    const tracks = userSongs.length;
    const streams = userSongs.reduce((sum, song) => sum + (song.plays || 0), 0);
    return { tracks, streams };
  }

  async getMessages(): Promise<Message[]> {
    // Return a deep copy to simulate DB fetch
    return JSON.parse(JSON.stringify(this.messages));
  }

  async addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    this.messages.push(newMessage);
    return JSON.parse(JSON.stringify(newMessage));
  }

  async editMessage(id: string, userId: string, text: string): Promise<Message> {
    const index = this.messages.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Message not found');
    
    this.messages[index] = { ...this.messages[index], text };
    return JSON.parse(JSON.stringify(this.messages[index]));
  }

  async deleteMessage(id: string, userId: string): Promise<void> {
    this.messages = this.messages.filter(m => m.id !== id);
  }
}

export const mockDb = new MockDB();
