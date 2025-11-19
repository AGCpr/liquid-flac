import React, { useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { PlayState } from '../types';

const AudioPlayer: React.FC = () => {
  const { currentSong, playState, progress, togglePlay, seek, volume, setVolume, skipForward, skipBackward } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      if (!ctx || !canvas) return;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = 4;
      const gap = 2;
      const bars = Math.floor(width / (barWidth + gap));

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';

      for (let i = 0; i < bars; i++) {
        // If playing, randomize height slightly to simulate audio reactivity
        const isActive = playState === PlayState.PLAYING;
        const randomHeight = isActive ? Math.random() * height : height * 0.2;
        const x = i * (barWidth + gap);
        const h = randomHeight;
        const y = (height - h) / 2;
        
        // Draw mirror effect for "liquid" look
        ctx.fillRect(x, y, barWidth, h);
      }

      if (playState === PlayState.PLAYING) {
        animationId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [playState]);

  if (!currentSong) return null;

  const formatTime = (seconds: number) => {
      if (!seconds || isNaN(seconds)) return "0:00";
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate current time based on progress percentage
  const currentTime = (progress / 100) * currentSong.duration;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-2xl border-t border-white/10 z-50 flex items-center px-6 pb-safe">
        <div className="absolute top-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent w-full"></div>
        
        {/* Left: Song Info */}
        <div className="flex items-center w-1/4 min-w-[140px] gap-4">
            <div className="w-14 h-14 rounded-md overflow-hidden shadow-lg relative group">
                <img src={currentSong.coverUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="hidden sm:block">
                <h4 className="text-white font-medium text-sm truncate max-w-[150px]">{currentSong.title}</h4>
                <p className="text-gray-400 text-xs truncate max-w-[150px]">{currentSong.artist}</p>
            </div>
        </div>

        {/* Center: Controls & Waveform */}
        <div className="flex-1 flex flex-col items-center max-w-2xl mx-auto">
            <div className="flex items-center gap-6 mb-2">
                <button 
                    onClick={() => skipBackward(10)}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Skip backward 10 seconds"
                >
                    <SkipBack size={20} />
                </button>
                <button 
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                >
                    {playState === PlayState.PLAYING ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
                </button>
                <button 
                    onClick={() => skipForward(10)}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Skip forward 10 seconds"
                >
                    <SkipForward size={20} />
                </button>
            </div>
            
            <div className="w-full flex items-center gap-3 group">
                <span className="text-[10px] text-gray-500 font-mono w-8 text-right">
                    {formatTime(currentTime)}
                </span>
                
                <div className="relative flex-1 h-8 flex items-center cursor-pointer" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    seek((x / rect.width) * 100);
                }}>
                   {/* Canvas Waveform Background */}
                   <canvas ref={canvasRef} width={400} height={32} className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" />
                   
                   {/* Progress Bar */}
                   <div className="absolute w-full h-1 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-white relative" style={{ width: `${progress}%` }}>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       </div>
                   </div>
                </div>

                <span className="text-[10px] text-gray-500 font-mono w-8">
                     {formatTime(currentSong.duration)}
                </span>
            </div>
        </div>

        {/* Right: Volume */}
        <div className="w-1/4 flex justify-end items-center gap-2 hidden md:flex">
            <Volume2 size={16} className="text-gray-400" />
            <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
        </div>
    </div>
  );
};

export default AudioPlayer;