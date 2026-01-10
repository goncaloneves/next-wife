import { useRef, useCallback, useEffect } from 'react';

interface BoomerangState {
  direction: 1 | -1;
  rafId: number | null;
  lastTime: number;
  cancelled: boolean;
}

export function useBoomerangVideo() {
  const statesRef = useRef<Map<string, BoomerangState>>(new Map());
  
  const startBoomerang = useCallback((video: HTMLVideoElement, id: string) => {
    if (!video) return;
    
    const existingState = statesRef.current.get(id);
    if (existingState) {
      existingState.cancelled = true;
      if (existingState.rafId) {
        cancelAnimationFrame(existingState.rafId);
      }
    }
    
    const state: BoomerangState = { 
      direction: 1, 
      rafId: null, 
      lastTime: 0,
      cancelled: false
    };
    statesRef.current.set(id, state);
    
    const waitForDuration = () => {
      if (state.cancelled) return;
      
      if (!video.duration || video.duration === Infinity || isNaN(video.duration)) {
        setTimeout(waitForDuration, 100);
        return;
      }
      
      video.pause();
      video.currentTime = 0;
      state.lastTime = performance.now();
      
      const playbackSpeed = 1.0;
      
      const animate = (now: number) => {
        if (state.cancelled) return;
        
        const deltaMs = Math.min(now - state.lastTime, 100);
        state.lastTime = now;
        
        const deltaSeconds = (deltaMs / 1000) * playbackSpeed;
        const newTime = video.currentTime + (state.direction * deltaSeconds);
        
        if (newTime >= video.duration - 0.02) {
          video.currentTime = video.duration - 0.02;
          state.direction = -1;
        } else if (newTime <= 0.02) {
          video.currentTime = 0.02;
          state.direction = 1;
        } else {
          video.currentTime = newTime;
        }
        
        state.rafId = requestAnimationFrame(animate);
      };
      
      state.rafId = requestAnimationFrame(animate);
    };
    
    waitForDuration();
  }, []);
  
  const stopBoomerang = useCallback((id: string, video?: HTMLVideoElement | null): void => {
    const state = statesRef.current.get(id);
    if (state) {
      state.cancelled = true;
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
      }
    }
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    statesRef.current.delete(id);
  }, []);
  
  const stopAll = useCallback(() => {
    statesRef.current.forEach((state) => {
      state.cancelled = true;
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
      }
    });
    statesRef.current.clear();
  }, []);
  
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);
  
  return { startBoomerang, stopBoomerang, stopAll };
}

export function useSingleBoomerangVideo() {
  const directionRef = useRef<1 | -1>(1);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cancelledRef = useRef<boolean>(false);
  
  const start = useCallback((video: HTMLVideoElement) => {
    if (!video) return;
    videoRef.current = video;
    cancelledRef.current = false;
    
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    const waitForDuration = () => {
      if (cancelledRef.current) return;
      
      if (!video.duration || video.duration === Infinity || isNaN(video.duration)) {
        setTimeout(waitForDuration, 100);
        return;
      }
      
      video.pause();
      directionRef.current = 1;
      video.currentTime = 0;
      lastTimeRef.current = performance.now();
      
      const playbackSpeed = 1.0;
      
      const animate = (now: number) => {
        if (cancelledRef.current) return;
        
        const deltaMs = Math.min(now - lastTimeRef.current, 100);
        lastTimeRef.current = now;
        
        const deltaSeconds = (deltaMs / 1000) * playbackSpeed;
        const newTime = video.currentTime + (directionRef.current * deltaSeconds);
        
        if (newTime >= video.duration - 0.02) {
          video.currentTime = video.duration - 0.02;
          directionRef.current = -1;
        } else if (newTime <= 0.02) {
          video.currentTime = 0.02;
          directionRef.current = 1;
        } else {
          video.currentTime = newTime;
        }
        
        rafIdRef.current = requestAnimationFrame(animate);
      };
      
      rafIdRef.current = requestAnimationFrame(animate);
    };
    
    waitForDuration();
  }, []);
  
  const stop = useCallback(() => {
    cancelledRef.current = true;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);
  
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);
  
  return { start, stop };
}
