import { useRef, useCallback, useEffect } from 'react';

interface BoomerangState {
  frames: ImageBitmap[];
  frameIndex: number;
  reverse: boolean;
  rafId: number | null;
  cancelled: boolean;
  phase: 'capturing' | 'playing';
  overlayCanvas: HTMLCanvasElement | null;
  captureErrors: number;
}

const MAX_CAPTURE_ERRORS = 3;
const MIN_FRAMES = 5;
const CAPTURE_FPS = 14;

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
      if (existingState.overlayCanvas) {
        existingState.overlayCanvas.remove();
      }
      existingState.frames.forEach(f => f.close());
    }
    
    const state: BoomerangState = { 
      frames: [],
      frameIndex: 0,
      reverse: false,
      rafId: null, 
      cancelled: false,
      phase: 'capturing',
      overlayCanvas: null,
      captureErrors: 0
    };
    statesRef.current.set(id, state);
    
    const abortBoomerang = () => {
      state.cancelled = true;
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
      }
      if (state.overlayCanvas) {
        state.overlayCanvas.remove();
      }
      state.frames.forEach(f => f.close());
      state.frames = [];
      video.style.opacity = '';
      video.muted = true;
      video.loop = true;
      video.currentTime = 0;
      video.play().catch(() => {});
      statesRef.current.delete(id);
    };
    
    const setupBoomerang = () => {
      if (state.cancelled) return;
      
      if (!video.duration || video.duration === Infinity || isNaN(video.duration) || video.readyState < 2) {
        setTimeout(setupBoomerang, 50);
        return;
      }
      
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      if (width === 0 || height === 0) {
        setTimeout(setupBoomerang, 50);
        return;
      }
      
      const parent = video.parentElement;
      if (parent) {
        const computedStyle = window.getComputedStyle(parent);
        if (computedStyle.position === 'static') {
          parent.style.position = 'relative';
        }
      }
      
      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.width = width;
      overlayCanvas.height = height;
      overlayCanvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        pointer-events: none;
        opacity: 0;
      `;
      overlayCanvas.dataset.boomerangCanvas = id;
      state.overlayCanvas = overlayCanvas;
      
      if (parent) {
        const existing = parent.querySelector(`[data-boomerang-canvas="${id}"]`);
        if (existing) existing.remove();
        parent.appendChild(overlayCanvas);
      }
      
      const overlayCtx = overlayCanvas.getContext('2d');
      if (!overlayCtx) {
        abortBoomerang();
        return;
      }
      
      video.currentTime = 0;
      video.muted = true;
      video.loop = false;
      
      let lastCaptureTime = 0;
      
      const captureLoop = async (now: number) => {
        if (state.cancelled) return;
        
        if (state.phase === 'capturing') {
          const elapsed = now - lastCaptureTime;
          if (elapsed >= 1000 / CAPTURE_FPS) {
            lastCaptureTime = now;
            
            try {
              const bitmap = await createImageBitmap(video);
              state.frames.push(bitmap);
              overlayCtx.drawImage(bitmap, 0, 0, width, height);
            } catch (e) {
              state.captureErrors++;
              if (state.captureErrors >= MAX_CAPTURE_ERRORS) {
                abortBoomerang();
                return;
              }
            }
          }
          
          const nearEnd = video.currentTime >= video.duration - 0.1;
          const hasEnoughFrames = state.frames.length >= MIN_FRAMES;
          
          if ((nearEnd || video.ended) && hasEnoughFrames) {
            video.pause();
            video.style.opacity = '0';
            overlayCanvas.style.opacity = '1';
            state.phase = 'playing';
            state.frameIndex = state.frames.length - 1;
            state.reverse = true;
            lastCaptureTime = now;
          } else if ((nearEnd || video.ended) && !hasEnoughFrames) {
            abortBoomerang();
            return;
          }
          
          state.rafId = requestAnimationFrame(captureLoop);
        } else {
          const elapsed = now - lastCaptureTime;
          if (elapsed >= 1000 / CAPTURE_FPS) {
            lastCaptureTime = now;
            
            if (state.frames.length > 0 && state.frameIndex >= 0 && state.frameIndex < state.frames.length) {
              overlayCtx.clearRect(0, 0, width, height);
              overlayCtx.drawImage(state.frames[state.frameIndex], 0, 0, width, height);
              
              if (!state.reverse) {
                state.frameIndex++;
                if (state.frameIndex >= state.frames.length - 1) {
                  state.reverse = true;
                }
              } else {
                state.frameIndex--;
                if (state.frameIndex <= 0) {
                  state.reverse = false;
                }
              }
            }
          }
          
          state.rafId = requestAnimationFrame(captureLoop);
        }
      };
      
      video.play().then(() => {
        state.rafId = requestAnimationFrame(captureLoop);
      }).catch(() => {
        abortBoomerang();
      });
    };
    
    setupBoomerang();
  }, []);
  
  const stopBoomerang = useCallback((id: string, video?: HTMLVideoElement | null): void => {
    const state = statesRef.current.get(id);
    if (state) {
      state.cancelled = true;
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
      }
      if (state.overlayCanvas) {
        state.overlayCanvas.remove();
      }
      state.frames.forEach(f => f.close());
      state.frames = [];
    }
    if (video) {
      video.style.opacity = '';
      video.pause();
      video.currentTime = 0;
      
      if (video.parentElement) {
        const canvas = video.parentElement.querySelector(`[data-boomerang-canvas="${id}"]`);
        if (canvas) canvas.remove();
      }
    }
    statesRef.current.delete(id);
  }, []);
  
  const stopAll = useCallback(() => {
    statesRef.current.forEach((state) => {
      state.cancelled = true;
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
      }
      if (state.overlayCanvas) {
        state.overlayCanvas.remove();
      }
      state.frames.forEach(f => f.close());
      state.frames = [];
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
  const framesRef = useRef<ImageBitmap[]>([]);
  const frameIndexRef = useRef<number>(0);
  const reverseRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cancelledRef = useRef<boolean>(false);
  const phaseRef = useRef<'capturing' | 'playing'>('capturing');
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureErrorsRef = useRef<number>(0);
  
  const abort = useCallback(() => {
    cancelledRef.current = true;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (overlayCanvasRef.current) {
      overlayCanvasRef.current.remove();
      overlayCanvasRef.current = null;
    }
    framesRef.current.forEach(f => f.close());
    framesRef.current = [];
    
    const video = videoRef.current;
    if (video) {
      video.style.opacity = '';
      video.muted = true;
      video.loop = true;
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }, []);
  
  const start = useCallback((video: HTMLVideoElement) => {
    if (!video) return;
    videoRef.current = video;
    cancelledRef.current = false;
    framesRef.current.forEach(f => f.close());
    framesRef.current = [];
    frameIndexRef.current = 0;
    reverseRef.current = false;
    phaseRef.current = 'capturing';
    captureErrorsRef.current = 0;
    
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    if (overlayCanvasRef.current) {
      overlayCanvasRef.current.remove();
      overlayCanvasRef.current = null;
    }
    
    const setupBoomerang = () => {
      if (cancelledRef.current) return;
      
      if (!video.duration || video.duration === Infinity || isNaN(video.duration) || video.readyState < 2) {
        setTimeout(setupBoomerang, 50);
        return;
      }
      
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      if (width === 0 || height === 0) {
        setTimeout(setupBoomerang, 50);
        return;
      }
      
      const parent = video.parentElement;
      if (parent) {
        const computedStyle = window.getComputedStyle(parent);
        if (computedStyle.position === 'static') {
          parent.style.position = 'relative';
        }
      }
      
      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.width = width;
      overlayCanvas.height = height;
      overlayCanvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        pointer-events: none;
        opacity: 0;
      `;
      overlayCanvas.dataset.boomerangCanvas = 'single';
      overlayCanvasRef.current = overlayCanvas;
      
      if (parent) {
        const existing = parent.querySelector('[data-boomerang-canvas="single"]');
        if (existing) existing.remove();
        parent.appendChild(overlayCanvas);
      }
      
      const overlayCtx = overlayCanvas.getContext('2d');
      if (!overlayCtx) {
        abort();
        return;
      }
      
      video.currentTime = 0;
      video.muted = true;
      video.loop = false;
      
      let lastCaptureTime = 0;
      
      const captureLoop = async (now: number) => {
        if (cancelledRef.current) return;
        
        if (phaseRef.current === 'capturing') {
          const elapsed = now - lastCaptureTime;
          if (elapsed >= 1000 / CAPTURE_FPS) {
            lastCaptureTime = now;
            
            try {
              const bitmap = await createImageBitmap(video);
              framesRef.current.push(bitmap);
              overlayCtx.drawImage(bitmap, 0, 0, width, height);
            } catch (e) {
              captureErrorsRef.current++;
              if (captureErrorsRef.current >= MAX_CAPTURE_ERRORS) {
                abort();
                return;
              }
            }
          }
          
          const nearEnd = video.currentTime >= video.duration - 0.1;
          const hasEnoughFrames = framesRef.current.length >= MIN_FRAMES;
          
          if ((nearEnd || video.ended) && hasEnoughFrames) {
            video.pause();
            video.style.opacity = '0';
            overlayCanvas.style.opacity = '1';
            phaseRef.current = 'playing';
            frameIndexRef.current = framesRef.current.length - 1;
            reverseRef.current = true;
            lastCaptureTime = now;
          } else if ((nearEnd || video.ended) && !hasEnoughFrames) {
            abort();
            return;
          }
          
          rafIdRef.current = requestAnimationFrame(captureLoop);
        } else {
          const elapsed = now - lastCaptureTime;
          if (elapsed >= 1000 / CAPTURE_FPS) {
            lastCaptureTime = now;
            
            if (framesRef.current.length > 0 && frameIndexRef.current >= 0 && frameIndexRef.current < framesRef.current.length) {
              overlayCtx.clearRect(0, 0, width, height);
              overlayCtx.drawImage(framesRef.current[frameIndexRef.current], 0, 0, width, height);
              
              if (!reverseRef.current) {
                frameIndexRef.current++;
                if (frameIndexRef.current >= framesRef.current.length - 1) {
                  reverseRef.current = true;
                }
              } else {
                frameIndexRef.current--;
                if (frameIndexRef.current <= 0) {
                  reverseRef.current = false;
                }
              }
            }
          }
          
          rafIdRef.current = requestAnimationFrame(captureLoop);
        }
      };
      
      video.play().then(() => {
        rafIdRef.current = requestAnimationFrame(captureLoop);
      }).catch(() => {
        abort();
      });
    };
    
    setupBoomerang();
  }, [abort]);
  
  const stop = useCallback(() => {
    cancelledRef.current = true;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (overlayCanvasRef.current) {
      overlayCanvasRef.current.remove();
      overlayCanvasRef.current = null;
    }
    framesRef.current.forEach(f => f.close());
    framesRef.current = [];
    
    if (videoRef.current) {
      videoRef.current.style.opacity = '';
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      
      if (videoRef.current.parentElement) {
        const canvas = videoRef.current.parentElement.querySelector('[data-boomerang-canvas="single"]');
        if (canvas) canvas.remove();
      }
    }
  }, []);
  
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.remove();
      }
      framesRef.current.forEach(f => f.close());
      framesRef.current = [];
    };
  }, []);
  
  return { start, stop };
}
