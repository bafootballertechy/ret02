import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Video } from 'lucide-react';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];

  const handleFile = (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload MP4, MOV, WEBM, or AVI files.');
      return;
    }

    setError('');
    setIsUploading(true);
    setProgress(0);

    const videoURL = URL.createObjectURL(file);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          sessionStorage.setItem('currentVideoURL', videoURL);
          sessionStorage.setItem('videoName', file.name);
          setTimeout(() => {
            navigate('/analysis');
          }, 300);
          return 100;
        }
        return prev + 5;
      });
    }, 50);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-gradient rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">RetFlow Telestration</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-text mb-3">Upload Your Video</h2>
            <p className="text-gray-600">
              Drag and drop your video file or click to browse
            </p>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-2xl p-16 transition-all duration-300 cursor-pointer ${
              isDragging
                ? 'border-primary bg-orange-50 scale-105'
                : 'border-gray-300 bg-white hover:border-primary hover:bg-orange-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileInput}
            />

            <div className="flex flex-col items-center justify-center gap-6">
              {isUploading ? (
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#EAEAEA"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${progress * 3.51} 351`}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF8A00" />
                        <stop offset="100%" stopColor="#FF3C00" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-text">{progress}%</span>
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-orange-gradient flex items-center justify-center shadow-lg">
                  <Upload className="w-16 h-16 text-white" />
                </div>
              )}

              {!isUploading && (
                <>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-text mb-2">
                      Drop your video here
                    </p>
                    <p className="text-gray-500 text-sm">or click to browse files</p>
                  </div>

                  <button className="px-8 py-3 bg-orange-gradient text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                    Choose File
                  </button>
                </>
              )}

              {error && (
                <div className="text-red-500 text-sm font-medium">{error}</div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Supported formats: MP4, MOV, WEBM, AVI
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
