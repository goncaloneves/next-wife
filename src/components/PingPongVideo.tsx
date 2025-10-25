import { useEffect, useRef } from "react";

interface PingPongVideoProps {
  src: string;
  className?: string;
}

const PingPongVideo = ({ src, className }: PingPongVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      // When video ends, play it backwards
      video.playbackRate = -1;
      video.currentTime = video.duration;
      video.play();
    };

    const handleTimeUpdate = () => {
      // When playing backwards and reaching the start, play forward again
      if (video.playbackRate === -1 && video.currentTime <= 0.1) {
        video.playbackRate = 1;
        video.currentTime = 0;
        video.play();
      }
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    
    // Start playing
    video.play();

    return () => {
      video.removeEventListener('ended', handleEnded);
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
