import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Snowflake,
  Upload as UploadIcon,
  Edit2,
  Trash2,
  Video,
  EyeOff,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Annotation {
  id: string;
  video_name: string;
  timestamp: number;
  type: string;
  drawings: any[];
  fade_in: boolean;
  fade_out: boolean;
  duration: number;
  color: string;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export default function AnalysisPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [maskingEnabled, setMaskingEnabled] = useState(false);
  const navigate = useNavigate();

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    const url = sessionStorage.getItem('currentVideoURL');
    const name = sessionStorage.getItem('videoName') || 'Untitled Video';

    if (url) {
      setVideoURL(url);
      setVideoName(name);
      loadAnnotations(name);
    }
  }, []);

  const loadAnnotations = async (videoName: string) => {
    const { data, error } = await supabase
      .from('annotations')
      .select('*')
      .eq('video_name', videoName)
      .order('timestamp', { ascending: true });

    if (!error && data) {
      setAnnotations(data);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoURL]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, currentTime - 10);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, currentTime + 10);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
    if (vol === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const cyclePlaybackRate = () => {
    const currentIndex = playbackRates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % playbackRates.length;
    const newRate = playbackRates[nextIndex];
    setPlaybackRate(newRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleFreezeFrame = () => {
    if (!videoRef.current) return;

    videoRef.current.pause();

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const frameData = canvas.toDataURL('image/jpeg', 0.8);

      sessionStorage.setItem('frozenFrame', frameData);
      sessionStorage.setItem('freezeTime', currentTime.toString());
      sessionStorage.removeItem('editingAnnotation');

      navigate('/annotate');
    }
  };

  const handleEditAnnotation = async (annotation: Annotation) => {
    if (!videoRef.current) return;

    videoRef.current.currentTime = annotation.timestamp;
    videoRef.current.pause();

    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const frameData = canvas.toDataURL('image/jpeg', 0.8);

      sessionStorage.setItem('frozenFrame', frameData);
      sessionStorage.setItem('freezeTime', annotation.timestamp.toString());
      sessionStorage.setItem('editingAnnotation', JSON.stringify(annotation));

      navigate('/annotate');
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    const { error } = await supabase
      .from('annotations')
      .delete()
      .eq('id', id);

    if (!error) {
      setAnnotations(annotations.filter(a => a.id !== id));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnnotationMarkerPosition = (timestamp: number) => {
    return (timestamp / duration) * 100;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-8 py-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-gradient rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text">RetFlow Telestration</h1>
          </div>
          {videoName && (
            <p className="text-sm text-gray-600 font-medium">{videoName}</p>
          )}
        </div>
      </header>

      <div className="flex-1 flex gap-6 p-6">
        <div className="flex-1 flex flex-col">
          <div className="bg-black rounded-2xl overflow-hidden shadow-2xl mb-4">
            {videoURL ? (
              <video
                ref={videoRef}
                src={videoURL}
                className="w-full aspect-video cursor-pointer"
                onClick={togglePlayPause}
              />
            ) : (
              <div className="w-full aspect-video flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Video className="w-20 h-20 mx-auto mb-4 opacity-50" />
                  <p>No video loaded</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="mb-6">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.01"
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={!videoURL}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-orange"
                  style={{
                    background: videoURL
                      ? `linear-gradient(to right, #FF8A00 0%, #FF3C00 ${
                          (currentTime / duration) * 100
                        }%, #EAEAEA ${(currentTime / duration) * 100}%, #EAEAEA 100%)`
                      : '#EAEAEA',
                  }}
                />
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="absolute top-0 w-1 h-2 bg-blue-500 rounded-full transform -translate-x-1/2"
                    style={{ left: `${getAnnotationMarkerPosition(annotation.timestamp)}%` }}
                    title={`Annotation at ${formatTime(annotation.timestamp)}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={skipBackward}
                  disabled={!videoURL}
                  className="p-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SkipBack className="w-5 h-5 text-text" />
                </button>

                <button
                  onClick={togglePlayPause}
                  disabled={!videoURL}
                  className="p-4 bg-orange-gradient rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                </button>

                <button
                  onClick={skipForward}
                  disabled={!videoURL}
                  className="p-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SkipForward className="w-5 h-5 text-text" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-text" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-text" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={cyclePlaybackRate}
                  className="px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold text-text"
                >
                  {playbackRate}x
                </button>

                <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Maximize className="w-5 h-5 text-text" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-semibold text-text">Masking</span>
              </div>
              <button
                onClick={() => setMaskingEnabled(!maskingEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  maskingEnabled ? 'bg-orange-gradient' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    maskingEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleFreezeFrame}
              disabled={!videoURL}
              className="w-full py-3 bg-orange-gradient text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Snowflake className="w-5 h-5" />
              Freeze Frame
            </button>

            <button
              disabled
              className="w-full mt-3 py-3 bg-gray-200 text-gray-400 font-semibold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
            >
              <UploadIcon className="w-5 h-5" />
              Export Video
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-lg flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-text mb-4">ANNOTATION LISTING</h3>

            <div className="flex-1 overflow-y-auto space-y-3">
              {annotations.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <p>No annotations yet</p>
                  <p className="text-sm mt-2">Click "Freeze Frame" to start</p>
                </div>
              ) : (
                annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="bg-panel rounded-xl p-3 hover:shadow-md transition-shadow group relative"
                  >
                    <div className="flex gap-3">
                      {annotation.thumbnail && (
                        <img
                          src={annotation.thumbnail}
                          alt="Annotation thumbnail"
                          className="w-20 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-text">
                            {formatTime(annotation.timestamp)}
                          </span>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: annotation.color }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 capitalize">
                          {annotation.type} Annotation
                        </p>
                        <div className="flex gap-1 mt-1">
                          <span className="text-xs bg-white px-2 py-0.5 rounded">
                            {annotation.duration}s
                          </span>
                          {annotation.fade_in && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Fade In
                            </span>
                          )}
                          {annotation.fade_out && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Fade Out
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => handleEditAnnotation(annotation)}
                        className="p-1.5 bg-white rounded-lg shadow-md hover:bg-orange-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-primary" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnotation(annotation.id)}
                        className="p-1.5 bg-white rounded-lg shadow-md hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
