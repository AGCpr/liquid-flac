import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, CheckCircle, Music, User, Disc, Mic2, Sparkles, Loader2, ArrowRight, ImagePlus, Activity } from 'lucide-react';
import { db } from '../services/db';
import { Song } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';

type UploadStep = 'drop' | 'analyzing' | 'edit' | 'uploading' | 'complete';

const Upload: React.FC = () => {
  const [step, setStep] = useState<UploadStep>('drop');
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [fetchingLyrics, setFetchingLyrics] = useState(false);

  const [audioStats, setAudioStats] = useState({
      duration: 0,
      sampleRate: 0,
      bitrate: 0,
      channels: 0,
      format: 'FLAC'
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(`https://picsum.photos/400/400?random=${Math.floor(Math.random() * 100)}`);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndAnalyzeFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndAnalyzeFile = async (file: File) => {
    if (file.type.startsWith('audio/') || file.name.endsWith('.flac') || file.name.endsWith('.mp3') || file.name.endsWith('.wav')) {
      setFile(file);
      setStep('analyzing');

      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const parts = nameWithoutExt.split(' - ');
      if (parts.length >= 2) {
          setArtist(parts[0].trim());
          setTitle(parts[1].trim());
      } else {
          setTitle(nameWithoutExt.trim());
          setArtist('Unknown Artist');
      }
      setAlbum('Single'); 

      try {
          const arrayBuffer = await file.arrayBuffer();
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

          const duration = audioBuffer.duration;
          const sampleRate = audioBuffer.sampleRate;
          const channels = audioBuffer.numberOfChannels;
          const bitrate = Math.round((file.size * 8) / duration / 1000);
          const format = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';

          setAudioStats({
              duration,
              sampleRate,
              bitrate,
              channels,
              format
          });

          setStep('edit');
      } catch (error) {
          console.error("Analysis failed", error);
          alert("Could not analyze audio file structure.");
          setStep('drop');
      }

    } else {
      alert("Please upload a valid FLAC or audio file.");
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const imgFile = e.target.files[0];
      if (!imgFile.type.startsWith('image/')) {
        alert("Please select a valid image file.");
        return;
      }
      setCoverFile(imgFile);
      setCoverPreview(URL.createObjectURL(imgFile));
    }
  };

  const fetchLyrics = async () => {
      if (!title || !artist) return;
      setFetchingLyrics(true);
      try {
          const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
          const data = await response.json();
          if (data.lyrics) {
              setLyrics(data.lyrics);
          } else {
              alert("Lyrics not found via API.");
          }
      } catch (error) {
          alert("Could not connect to lyrics service.");
      } finally {
          setFetchingLyrics(false);
      }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    // Validation
    if (!title.trim() || !artist.trim()) {
      alert('Please provide at least a title and artist name.');
      return;
    }

    setStep('uploading');

    let audioFilePath: string | null = null;
    let coverFilePath: string | null = null;

    try {
      // 1. Upload audio file
      audioFilePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: audioError } = await supabase.storage.from('songs').upload(audioFilePath, file);
      if (audioError) {
        throw new Error(`Audio upload failed: ${audioError.message}`);
      }
      const { data } = supabase.storage.from('songs').getPublicUrl(audioFilePath);
      const audioUrl = data.publicUrl;

      // 2. Upload cover file (if exists)
      let coverUrl = `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 100)}`;
      if (coverFile) {
        coverFilePath = `${user.id}/${Date.now()}_${coverFile.name}`;
        const { error: coverError } = await supabase.storage.from('covers').upload(coverFilePath, coverFile);
        if (coverError) {
          // Rollback: delete audio file if cover upload fails
          if (audioFilePath) {
            await supabase.storage.from('songs').remove([audioFilePath]);
          }
          throw new Error(`Cover upload failed: ${coverError.message}`);
        }
        const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(coverFilePath);
        coverUrl = publicUrl;
      }

      // 3. Save song metadata to database
      const newSong: Omit<Song, 'id' | 'created_at'> = {
        title: title.trim() || 'Untitled',
        artist: artist.trim() || 'Unknown',
        album: album.trim() || 'Unknown Album',
        coverUrl,
        audioUrl,
        duration: audioStats.duration,
        lyrics: lyrics,
        format: audioStats.format,
        bitrate: audioStats.bitrate,
        sampleRate: audioStats.sampleRate,
        channels: audioStats.channels,
        uploaderId: user.id,
        plays: 0
      };

      await db.addSong(newSong);

      setStep('complete');
      setTimeout(() => navigate('/'), 2000);

    } catch (error: any) {
      console.error("Upload failed", error);
      
      // Rollback: Delete uploaded files if database insert failed
      try {
        if (audioFilePath) {
          await supabase.storage.from('songs').remove([audioFilePath]);
        }
        if (coverFilePath) {
          await supabase.storage.from('covers').remove([coverFilePath]);
        }
      } catch (rollbackError) {
        console.error("Failed to clean up uploaded files", rollbackError);
      }

      setStep('edit');
      const errorMessage = error?.message || "Failed to upload song. Please check your connection and try again.";
      alert(errorMessage);
    }
  };

  const reset = () => {
      setFile(null);
      setStep('drop');
      setTitle('');
      setArtist('');
      setAlbum('');
      setLyrics('');
      setCoverFile(null);
      setCoverPreview(`https://picsum.photos/400/400?random=${Math.floor(Math.random() * 100)}`);
  };

  return (
    <div className="h-full flex items-center justify-center p-6 pt-20 md:pt-0 overflow-y-auto">
      <div className="w-full max-w-3xl perspective-1000 my-auto">
        
        {step === 'drop' && (
            <div 
              className={`relative rounded-3xl p-16 text-center transition-all duration-500 ease-out min-h-[400px] flex flex-col items-center justify-center ${isDragging ? 'rotate-x-2 scale-105 bg-white/10 border-white' : 'bg-black/40 border-white/10'} backdrop-blur-2xl border border-dashed group cursor-pointer`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={`w-24 h-24 mx-auto bg-gradient-to-tr from-gray-800 to-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] mb-8 transition-transform duration-500 ${isDragging ? 'translate-y-[-20px] scale-110' : 'group-hover:scale-105'}`}>
                  <UploadCloud size={40} className={`${isDragging ? 'text-white' : 'text-gray-400 group-hover:text-white'} transition-colors`} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Upload Master Track</h2>
              <p className="text-gray-400 text-lg font-light">Drag & drop FLAC, WAV or MP3</p>
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => e.target.files && validateAndAnalyzeFile(e.target.files[0])}
                  className="hidden" 
                  accept=".flac,.mp3,.wav,audio/*"
              />
            </div>
        )}

        {step === 'analyzing' && (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
                 <Loader2 size={48} className="text-white animate-spin mx-auto mb-6" />
                 <h3 className="text-2xl font-bold text-white">Analyzing Audio Stream</h3>
                 <p className="text-gray-400 mt-2">Calculating bitrate and sample frequency...</p>
            </div>
        )}

        {step === 'edit' && file && (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 animate-in fade-in zoom-in duration-300 shadow-2xl">
                <div className="flex flex-wrap gap-4 mb-8 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                        <Activity size={14} className="text-green-400" />
                        <span className="font-mono">{audioStats.sampleRate}Hz</span>
                    </div>
                    <div className="w-px h-4 bg-white/10"></div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="font-mono">{audioStats.bitrate} kbps</span>
                    </div>
                    <div className="w-px h-4 bg-white/10"></div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="font-mono uppercase">{audioStats.format}</span>
                    </div>
                    <div className="ml-auto text-xs text-gray-400">
                        {audioStats.channels === 2 ? 'Stereo' : 'Mono'}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-6">
                         <div 
                            onClick={() => coverInputRef.current?.click()}
                            className="relative aspect-square w-full max-w-[200px] mx-auto rounded-2xl overflow-hidden border border-white/10 group cursor-pointer shadow-lg"
                         >
                             <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                 <div className="flex flex-col items-center text-white">
                                     <ImagePlus size={24} className="mb-1"/>
                                     <span className="text-xs font-bold uppercase">Change Cover</span>
                                 </div>
                             </div>
                             <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverSelect} />
                         </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider flex items-center gap-2"><Music size={12} /> Title</label>
                                <input 
                                    type="text" 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider flex items-center gap-2"><User size={12} /> Artist</label>
                                <input 
                                    type="text" 
                                    value={artist} 
                                    onChange={e => setArtist(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider flex items-center gap-2"><Disc size={12} /> Album</label>
                                <input 
                                    type="text" 
                                    value={album} 
                                    onChange={e => setAlbum(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col h-full">
                         <div className="flex items-center justify-between mb-2">
                             <label className="text-xs text-gray-400 uppercase font-bold tracking-wider flex items-center gap-2"><Mic2 size={12} /> Lyrics</label>
                             <button 
                                onClick={fetchLyrics}
                                disabled={fetchingLyrics || !title || !artist}
                                className="text-[10px] bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-3 py-1 rounded-full"
                             >
                                {fetchingLyrics ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                Auto-Detect
                             </button>
                         </div>
                         <textarea 
                             value={lyrics}
                             onChange={e => setLyrics(e.target.value)}
                             className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                             placeholder="Paste lyrics here or use Auto-Detect..."
                         />
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={reset} className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white">Cancel</button>
                    <button 
                        onClick={handleUpload}
                        className="flex-1 py-4 rounded-xl bg-white text-black font-bold text-lg"
                    >
                        Save to Library
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        )}

        {step === 'uploading' && (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
                 <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-8">
                     <Loader2 size={40} className="text-white animate-spin" />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">Uploading...</h3>
            </div>
        )}

        {step === 'complete' && (
            <div className="bg-black/40 backdrop-blur-xl border border-green-500/20 rounded-3xl p-12 text-center">
                <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={48} className="text-green-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Success</h3>
            </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
