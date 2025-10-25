import { useEffect, useRef } from "react";

interface PingPongVideoProps {
  src: string;
  className?: string;
}

const PingPongVideo = ({ src, className }: PingPongVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const directionRef = useRef<'forward' | 'backward'>('forward');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (directionRef.current === 'forward' && video.currentTime >= video.duration - 0.1) {
        directionRef.current = 'backward';
      } else if (directionRef.current === 'backward' && video.currentTime <= 0.1) {
        directionRef.current = 'forward';
      }

      if (directionRef.current === 'backward') {
        video.currentTime -= 0.033; // Step backwards
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.play();

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      className={className}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
};

export default PingPongVideo;
