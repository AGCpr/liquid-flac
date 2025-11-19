import { supabase } from './supabaseClient';
import { Song, Message } from '../types';

// Helper function to check if user is admin (would come from user context in real app)
const isAdmin = (userId: string): boolean => {
  // In a real app, this would check against a users table
  // For now, we'll check if email contains 'admin' or check a flag
  return userId.toLowerCase().includes('admin') || userId === 'u1';
};

class SupabaseService {
  async getAllSongs(): Promise<Song[]> {
    const { data, error } = await supabase.from('songs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    // Map created_at to createdAt for TypeScript consistency
    return (data || []).map((song: any) => ({
      ...song,
      createdAt: song.created_at ? new Date(song.created_at).getTime() : undefined
    }));
  }

  async getSongById(id: string): Promise<Song | null> {
    const { data, error } = await supabase.from('songs').select('*').eq('id', id).single();
    if (error) throw error;
    if (!data) return null;
    // Map created_at to createdAt for TypeScript consistency
    return {
      ...data,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : undefined
    };
  }

  async addSong(song: Omit<Song, 'id' | 'created_at'>): Promise<Song> {
    // Validation
    if (!song.title || !song.title.trim()) {
      throw new Error('Song title is required');
    }
    if (!song.artist || !song.artist.trim()) {
      throw new Error('Artist name is required');
    }
    if (!song.uploaderId) {
      throw new Error('Uploader ID is required');
    }

    const { data, error } = await supabase.from('songs').insert([song]).select().single();
    if (error) throw new Error(`Failed to add song: ${error.message}`);
    // Map created_at to createdAt for TypeScript consistency
    return {
      ...data,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : undefined
    };
  }

  async editSong(id: string, userId: string, updates: Partial<Song>): Promise<Song> {
    // Get the song first to check ownership
    const { data: existingSong, error: fetchError } = await supabase
      .from('songs')
      .select('uploaderId')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Song not found: ${fetchError.message}`);
    }

    // Authorization check: user must own the song or be admin
    if (existingSong.uploaderId !== userId && !isAdmin(userId)) {
      throw new Error('Unauthorized: You can only edit your own songs');
    }

    // Validation
    if (updates.title !== undefined && !updates.title.trim()) {
      throw new Error('Song title cannot be empty');
    }
    if (updates.artist !== undefined && !updates.artist.trim()) {
      throw new Error('Artist name cannot be empty');
    }

    const { data, error } = await supabase.from('songs').update(updates).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update song: ${error.message}`);
    // Map created_at to createdAt for TypeScript consistency
    return {
      ...data,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : undefined
    };
  }

  async deleteSong(id: string, userId: string): Promise<void> {
    // Get the song first to check ownership
    const { data: existingSong, error: fetchError } = await supabase
      .from('songs')
      .select('uploaderId')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Song not found: ${fetchError.message}`);
    }

    // Authorization check: user must own the song or be admin
    if (existingSong.uploaderId !== userId && !isAdmin(userId)) {
      throw new Error('Unauthorized: You can only delete your own songs');
    }

    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete song: ${error.message}`);
  }

  async incrementPlays(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_plays', { song_id: id });
    if (error) {
      // Fallback: try to update plays count manually if RPC doesn't exist
      const { data: song } = await supabase.from('songs').select('plays').eq('id', id).single();
      if (song) {
        await supabase.from('songs').update({ plays: (song.plays || 0) + 1 }).eq('id', id);
      }
    }
  }

  async getUserStats(userId: string): Promise<{ tracks: number; streams: number }> {
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('plays')
      .eq('uploaderId', userId);
    
    if (songsError) {
      return { tracks: 0, streams: 0 };
    }

    const tracks = songs?.length || 0;
    const streams = songs?.reduce((sum, song) => sum + (song.plays || 0), 0) || 0;
    
    return { tracks, streams };
  }

  async getMessages(): Promise<Message[]> {
    const { data, error } = await supabase.from('messages').select('*').order('timestamp', { ascending: true });
    if (error) throw error;
    return data;
  }

  async addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    // Validation
    if (!message.text || !message.text.trim()) {
      throw new Error('Message text is required');
    }
    if (!message.userId) {
      throw new Error('User ID is required');
    }
    if (!message.userName || !message.userName.trim()) {
      throw new Error('User name is required');
    }

    const { data, error } = await supabase.from('messages').insert([message]).select().single();
    if (error) throw new Error(`Failed to add message: ${error.message}`);
    return data;
  }

  async editMessage(id: string, userId: string, text: string): Promise<Message> {
    // Validation
    if (!text || !text.trim()) {
      throw new Error('Message text cannot be empty');
    }

    // Get the message first to check ownership
    const { data: existingMessage, error: fetchError } = await supabase
      .from('messages')
      .select('userId')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Message not found: ${fetchError.message}`);
    }

    // Authorization check: user must own the message or be admin
    if (existingMessage.userId !== userId && !isAdmin(userId)) {
      throw new Error('Unauthorized: You can only edit your own messages');
    }

    const { data, error } = await supabase.from('messages').update({ text }).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update message: ${error.message}`);
    return data;
  }

  async deleteMessage(id: string, userId: string): Promise<void> {
    // Get the message first to check ownership
    const { data: existingMessage, error: fetchError } = await supabase
      .from('messages')
      .select('userId')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Message not found: ${fetchError.message}`);
    }

    // Authorization check: user must own the message or be admin
    if (existingMessage.userId !== userId && !isAdmin(userId)) {
      throw new Error('Unauthorized: You can only delete your own messages');
    }

    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete message: ${error.message}`);
  }
}

export const db = new SupabaseService();
