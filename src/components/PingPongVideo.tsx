import { useEffect, useRef } from "react";

interface PingPongVideoProps {
  src: string;
  className?: string;
  speed?: number; // 1 = normal speed
}

const PingPongVideo = ({ src, className, speed = 1 }: PingPongVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const directionRef = useRef<1 | -1>(1);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let running = true;

    const step = (ts: number) => {
      if (!running || !video || Number.isNaN(video.duration) || video.duration === Infinity) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      if (lastTsRef.current == null) {
        lastTsRef.current = ts;
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      const deltaS = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      let next = video.currentTime + directionRef.current * speed * deltaS;

      if (next >= video.duration) {
        next = video.duration;
        directionRef.current = -1;
      } else if (next <= 0) {
        next = 0;
        directionRef.current = 1;
      }

      // Apply the new time
      try {
        video.currentTime = next;
      } catch (e) {
        // Ignore occasional seek errors
      }

      rafRef.current = requestAnimationFrame(step);
    };

    const onLoaded = () => {
      // Ensure we start from beginning each mount
      try { video.currentTime = 0; } catch {}
      lastTsRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(step);
    };

    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("loadedmetadata", onLoaded);

    // Fallback start if metadata is already available
    if (video.readyState >= 1) onLoaded();

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      video.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [speed]);

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      preload="auto"
      className={className}
      aria-hidden
    >
      <source src={src} type="video/mp4" />
    </video>
  );
};

export default PingPongVideo;

