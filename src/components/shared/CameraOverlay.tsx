import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface CameraOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title: string;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({ isOpen, onClose, onCapture, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Prefer back camera
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Permission denied or camera not available');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      // Convert base64 to file
      const fetchImage = async () => {
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        onCapture(file);
        onClose();
      };
      fetchImage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
            <h3 className="text-white text-sm font-black uppercase tracking-widest">{title}</h3>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Viewport */}
          <div className="relative w-full h-full flex items-center justify-center">
            {error ? (
              <div className="text-center p-8">
                <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                <p className="text-white font-bold mb-6">{error}</p>
                <button 
                  onClick={startCamera}
                  className="px-8 py-3 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest"
                >
                  Retry Access
                </button>
              </div>
            ) : (
              <>
                {!capturedImage ? (
                  <video 
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={capturedImage} 
                    className="w-full h-full object-cover"
                    alt="Captured"
                  />
                )}
                
                {/* Guide lines */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-white/30 rounded-3xl" />
                </div>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-center gap-8">
            {!capturedImage ? (
              <button 
                onClick={capturePhoto}
                disabled={!!error || !stream}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform disabled:opacity-50"
              >
                <div className="w-16 h-16 rounded-full border-4 border-black" />
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setCapturedImage(null)}
                  className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20"
                >
                  <RefreshCw size={24} />
                </button>
                <button 
                  onClick={handleConfirm}
                  className="w-20 h-20 rounded-full bg-[#C88D67] flex items-center justify-center text-white shadow-2xl active:scale-90 transition-transform"
                >
                  <Check size={32} />
                </button>
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
