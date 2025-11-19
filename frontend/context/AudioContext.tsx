
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Song, PlayState } from '../types';
import { db } from '../services/db';

interface AudioContextType {
  currentSong: Song | null;
  playState: PlayState;
  progress: number; // 0 to 100
  volume: number; // 0 to 1
  playSong: (song: Song) => void;
  togglePlay: () => void;
  seek: (percent: number) => void;
  setVolume: (val: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playState, setPlayState] = useState<PlayState>(PlayState.STOPPED);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Keep track of object URLs to revoke them and prevent memory leaks
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio();
    // Enable cross-origin for demo files if needed
    audioRef.current.crossOrigin = "anonymous"; 
    
    const audio = audioRef.current;
    
    const updateProgress = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setPlayState(PlayState.STOPPED);
      setProgress(0);
    };

    // Handle errors (e.g., format not supported)
    const handleError = (e: Event) => {
        console.error("Audio playback error:", e);
        setPlayState(PlayState.STOPPED);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      if (currentUrlRef.current) {
          URL.revokeObjectURL(currentUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playSong = async (song: Song) => {
    if (!audioRef.current) return;
    
    // If clicking the same song that is already active
    if (currentSong?.id === song.id) {
      togglePlay();
      return;
    }

    // Increment Play Count in DB for Real Stats
    try {
        await db.incrementPlays(song.id);
    } catch (e) {
        console.error("Failed to increment play count", e);
    }

    // Cleanup previous blob URL if it exists
    if (currentUrlRef.current && currentUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
    }

    setPlayState(PlayState.BUFFERING);
    setCurrentSong(song);
    
    // If the song has a direct file object (from upload) but no URL generated yet, or needs refreshing
    let source = song.audioUrl;

    // Note: In a real app, we rely on the DB service to have already provided a blob URL 
    // or a remote URL.
    currentUrlRef.current = source;
    audioRef.current.src = source;
    
    try {
        await audioRef.current.play();
        setPlayState(PlayState.PLAYING);
    } catch (e: any) {
        console.error("Playback failed", e);
        setPlayState(PlayState.STOPPED);
        // Silently fail - user can try again by clicking play
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;

    if (playState === PlayState.PLAYING) {
      audioRef.current.pause();
      setPlayState(PlayState.PAUSED);
    } else {
      audioRef.current.play()
        .then(() => setPlayState(PlayState.PLAYING))
        .catch(e => console.error("Resume failed", e));
    }
  };

  const seek = (percent: number) => {
    if (!audioRef.current || !currentSong) return;
    
    const duration = audioRef.current.duration;
    if (!duration || isNaN(duration)) return;

    const time = (percent / 100) * duration;
    audioRef.current.currentTime = time;
    setProgress(percent);
  };

  const skipForward = (seconds: number = 10) => {
    if (!audioRef.current || !currentSong) return;
    
    const duration = audioRef.current.duration;
    if (!duration || isNaN(duration)) return;

    const newTime = Math.min(audioRef.current.currentTime + seconds, duration);
    audioRef.current.currentTime = newTime;
    setProgress((newTime / duration) * 100);
  };

  const skipBackward = (seconds: number = 10) => {
    if (!audioRef.current || !currentSong) return;
    
    const newTime = Math.max(audioRef.current.currentTime - seconds, 0);
    audioRef.current.currentTime = newTime;
    
    const duration = audioRef.current.duration;
    if (duration && !isNaN(duration)) {
      setProgress((newTime / duration) * 100);
    }
  };

  return (
    <AudioContext.Provider value={{ currentSong, playState, progress, volume, playSong, togglePlay, seek, setVolume, skipForward, skipBackward }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
