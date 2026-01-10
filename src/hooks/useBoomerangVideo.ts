import { useRef, useCallback, useEffect } from 'react';

interface BoomerangState {
  direction: 1 | -1;
  intervalId: number | null;
}

export function useBoomerangVideo() {
  const statesRef = useRef<Map<string, BoomerangState>>(new Map());
  
  const startBoomerang = useCallback((video: HTMLVideoElement, id: string) => {
    if (!video || !video.duration || video.duration === Infinity) return;
    
    let state = statesRef.current.get(id);
    if (state?.intervalId) {
      clearInterval(state.intervalId);
    }
    
    state = { direction: 1, intervalId: null };
    statesRef.current.set(id, state);
    
    video.currentTime = 0;
    video.playbackRate = 1;
    
    const fps = 30;
    const step = 1 / fps;
    
    const intervalId = window.setInterval(() => {
      const currentState = statesRef.current.get(id);
      if (!currentState || video.paused) {
        if (currentState?.intervalId) {
          clearInterval(currentState.intervalId);
          currentState.intervalId = null;
        }
        return;
      }
      
      const newTime = video.currentTime + (currentState.direction * step);
      
      if (newTime >= video.duration) {
        video.currentTime = video.duration - 0.01;
        currentState.direction = -1;
      } else if (newTime <= 0) {
        video.currentTime = 0.01;
        currentState.direction = 1;
      } else {
        video.currentTime = newTime;
      }
    }, 1000 / fps);
    
    state.intervalId = intervalId;
    statesRef.current.set(id, state);
  }, []);
  
  const stopBoomerang = useCallback((id: string) => {
    const state = statesRef.current.get(id);
    if (state?.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    statesRef.current.delete(id);
  }, []);
  
  const stopAll = useCallback(() => {
    statesRef.current.forEach((state, id) => {
      if (state.intervalId) {
        clearInterval(state.intervalId);
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

export function useSingleBoomerangVideo(videoRef: React.RefObject<HTMLVideoElement>) {
  const directionRef = useRef<1 | -1>(1);
  const intervalRef = useRef<number | null>(null);
  
  const start = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration || video.duration === Infinity) return;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    directionRef.current = 1;
    video.currentTime = 0;
    
    const fps = 30;
    const step = 1 / fps;
    
    intervalRef.current = window.setInterval(() => {
      if (!video || video.paused) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }
      
      const newTime = video.currentTime + (directionRef.current * step);
      
      if (newTime >= video.duration) {
        video.currentTime = video.duration - 0.01;
        directionRef.current = -1;
      } else if (newTime <= 0) {
        video.currentTime = 0.01;
        directionRef.current = 1;
      } else {
        video.currentTime = newTime;
      }
    }, 1000 / fps);
  }, [videoRef]);
  
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);
  
  return { start, stop };
}
