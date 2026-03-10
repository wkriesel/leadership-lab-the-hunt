import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Haptics utility
function triggerHaptics() {
  if (navigator.vibrate) {
    navigator.vibrate([50, 30, 50]); // pulse pattern: vibrate 50ms, pause 30ms, vibrate 50ms
  }
}

export default function SplashScreen({ onEnter }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [showFlash, setShowFlash] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  // Mount effects: haptics, video+audio sync, flash animation
  useEffect(() => {
    // Trigger haptics immediately
    triggerHaptics();

    // Small delay to sync video/audio start
    const mediaStartTimeout = setTimeout(() => {
      if (videoRef.current && audioRef.current) {
        videoRef.current.play().catch(err => console.log('Video play failed:', err));
        audioRef.current.play().catch(err => console.log('Audio play failed:', err));
      }
    }, 100);

    // Trigger flash animation at 500ms
    const flashTimeout = setTimeout(() => {
      setShowFlash(true);
    }, 500);

    return () => {
      clearTimeout(mediaStartTimeout);
      clearTimeout(flashTimeout);
    };
  }, []);

  const handleEnter = () => {
    setIsEntering(true);

    // Stop playback
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Store in localStorage to skip splash next time
    localStorage.setItem('splashScreenSeen', 'true');

    // Trigger callback after animation
    setTimeout(() => {
      onEnter();
    }, 500);
  };

  return (
    <div className="relative min-h-screen min-w-screen bg-black flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black opacity-80"></div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-screen">
        {/* Outer Frame with animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative w-full max-w-3xl aspect-video mx-auto px-4"
        >
          {/* Frame border - transforms from realistic to 8-bit */}
          <div
            className="absolute inset-0 rounded-lg border-8 border-stone-600 shadow-2xl animate-frame-transform"
            style={{
              boxShadow: '0 0 40px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Video container */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover rounded-sm"
              muted={false}
              loop={false}
              preload="auto"
            >
              <source src="/media/pitfall.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </motion.div>

        {/* Audio element (separate from video) */}
        <audio
          ref={audioRef}
          preload="auto"
          style={{ display: 'none' }}
        >
          <source src="/media/Pixelated_Odyssey.mp3" type="audio/mpeg" />
        </audio>

        {/* White Flash Overlay */}
        {showFlash && (
          <motion.div
            className="absolute inset-0 bg-white pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        )}

        {/* ENTER Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6, ease: 'easeOut' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleEnter}
          disabled={isEntering}
          className="absolute bottom-12 px-8 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-700 text-black font-bold rounded-lg text-lg transition-colors z-20 shadow-lg"
          style={{
            fontFamily: "'Press Start 2P', cursive",
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontSize: '14px',
          }}
        >
          {isEntering ? '...' : 'ENTER'}
        </motion.button>
      </div>

      {/* CSS for frame animation */}
      <style>{`
        @keyframes frameTransform {
          0% {
            border-style: solid;
            border-radius: 8px;
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.8);
          }
          50% {
            border-style: solid;
            border-radius: 6px;
            box-shadow: 0 0 50px rgba(255, 215, 0, 0.5),
                        inset 0 0 30px rgba(0, 0, 0, 0.9),
                        0 8px 0 -4px rgba(255, 215, 0, 0.4),
                        8px 0 0 -4px rgba(255, 215, 0, 0.4),
                        -8px 0 0 -4px rgba(255, 215, 0, 0.4),
                        0 -8px 0 -4px rgba(255, 215, 0, 0.4);
          }
          100% {
            border-style: solid;
            border-radius: 2px;
            box-shadow: 0 0 60px rgba(255, 215, 0, 0.6),
                        inset 0 0 40px rgba(0, 0, 0, 1),
                        0 8px 0 -4px rgba(255, 215, 0, 0.6),
                        8px 0 0 -4px rgba(255, 215, 0, 0.6),
                        -8px 0 0 -4px rgba(255, 215, 0, 0.6),
                        0 -8px 0 -4px rgba(255, 215, 0, 0.6),
                        16px 0 0 -8px rgba(255, 215, 0, 0.3),
                        -16px 0 0 -8px rgba(255, 215, 0, 0.3),
                        0 16px 0 -8px rgba(255, 215, 0, 0.3),
                        0 -16px 0 -8px rgba(255, 215, 0, 0.3);
          }
        }

        .animate-frame-transform {
          animation: frameTransform 2.5s ease-in-out 0.5s forwards;
        }
      `}</style>
    </div>
  );
}
