import { useState, useEffect, useRef, useCallback } from 'react';
import Taro from '@tarojs/taro';

export interface LoopSegment {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  loopEnabled: boolean;
  activeLoopId: string | null;
  isLoading: boolean;
  isSeeking: boolean;
}

const SAMPLE_AUDIO_URLS: Record<string, string> = {
  soprano: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  alto: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  tenor: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  bass: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  full: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
};

export function useAudioPlayer(
  audioSrc?: string,
  partType?: string,
  loops: LoopSegment[] = []
) {
  const audioRef = useRef<Taro.InnerAudioContext | null>(null);
  const simulatedTimeRef = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    speed: 1,
    loopEnabled: false,
    activeLoopId: null,
    isLoading: false,
    isSeeking: false,
  });

  const getAudioUrl = useCallback(() => {
    if (audioSrc && audioSrc.trim()) return audioSrc;
    if (partType && SAMPLE_AUDIO_URLS[partType]) return SAMPLE_AUDIO_URLS[partType];
    return SAMPLE_AUDIO_URLS.full;
  }, [audioSrc, partType]);

  const simulateProgress = useCallback(
    (playing: boolean, currentSpeed: number, activeLoop: LoopSegment | null) => {
      if (simulatedTimeRef.current) {
        clearInterval(simulatedTimeRef.current);
        simulatedTimeRef.current = null;
      }

      if (!playing) return;

      simulatedTimeRef.current = setInterval(() => {
        setState((prev) => {
          let newTime = prev.currentTime + currentSpeed;
          const dur = prev.duration || 240;

          if (activeLoop) {
            if (newTime >= activeLoop.endTime) {
              newTime = activeLoop.startTime;
            } else if (newTime < activeLoop.startTime) {
              newTime = activeLoop.startTime;
            }
          } else if (newTime >= dur) {
            if (prev.loopEnabled) {
              newTime = 0;
            } else {
              return { ...prev, isPlaying: false, currentTime: 0 };
            }
          }

          return { ...prev, currentTime: newTime };
        });
      }, 1000);
    },
    []
  );

  useEffect(() => {
    let duration = 240;
    try {
      const ctx = Taro.createInnerAudioContext();
      const url = getAudioUrl();
      ctx.src = url;
      audioRef.current = ctx;

      ctx.onCanplay(() => {
        const d = ctx.duration || 240;
        duration = d;
        setState((prev) => ({ ...prev, duration: d, isLoading: false }));
      });

      ctx.onTimeUpdate(() => {
        setState((prev) => {
          if (prev.isSeeking) return prev;
          return { ...prev, currentTime: ctx.currentTime };
        });
      });

      ctx.onPlay(() => {
        setState((prev) => ({ ...prev, isPlaying: true, isLoading: false }));
      });

      ctx.onPause(() => {
        setState((prev) => ({ ...prev, isPlaying: false }));
      });

      ctx.onEnded(() => {
        setState((prev) => {
          if (prev.loopEnabled) {
            return { ...prev, currentTime: 0, isPlaying: true };
          }
          return { ...prev, isPlaying: false, currentTime: 0 };
        });
      });

      ctx.onWaiting(() => {
        setState((prev) => ({ ...prev, isLoading: true }));
      });

      ctx.onError((err) => {
        console.error('[AudioPlayer] 音频播放错误:', err);
        setState((prev) => ({ ...prev, isLoading: false }));
      });

      setState((prev) => ({ ...prev, isLoading: true, duration }));

      ctx.onLoadedMetadata(() => {
        duration = ctx.duration || 240;
        setState((prev) => ({ ...prev, duration, isLoading: false }));
      });
    } catch (err) {
      console.error('[AudioPlayer] 初始化错误:', err);
      setState((prev) => ({ ...prev, duration }));
    }

    return () => {
      if (simulatedTimeRef.current) {
        clearInterval(simulatedTimeRef.current);
      }
      if (audioRef.current) {
        try {
          audioRef.current.stop();
          audioRef.current.destroy();
        } catch {}
      }
    };
  }, [getAudioUrl]);

  useEffect(() => {
    const activeLoop = state.activeLoopId
      ? loops.find((l) => l.id === state.activeLoopId)
      : null;
    simulateProgress(state.isPlaying, state.speed, activeLoop || null);

    return () => {
      if (simulatedTimeRef.current) {
        clearInterval(simulatedTimeRef.current);
      }
    };
  }, [state.isPlaying, state.speed, state.activeLoopId, loops, simulateProgress]);

  const play = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.play();
      }
      setState((prev) => ({ ...prev, isPlaying: true }));
    } catch (err) {
      console.error('[AudioPlayer] Play error:', err);
      setState((prev) => ({ ...prev, isPlaying: true }));
    }
  }, []);

  const pause = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } catch (err) {
      console.error('[AudioPlayer] Pause error:', err);
    }
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlay = useCallback(() => {
    setState((prev) => {
      const nextPlay = !prev.isPlaying;
      try {
        if (audioRef.current) {
          if (nextPlay) audioRef.current.play();
          else audioRef.current.pause();
        }
      } catch {}
      return { ...prev, isPlaying: nextPlay };
    });
  }, []);

  const seek = useCallback((time: number) => {
    try {
      if (audioRef.current) {
        audioRef.current.seek(time);
      }
    } catch (err) {
      console.error('[AudioPlayer] Seek error:', err);
    }
    setState((prev) => ({ ...prev, currentTime: Math.max(0, time) }));
  }, []);

  const skipForward = useCallback(
    (seconds = 10) => {
      setState((prev) => {
        const newTime = Math.min(prev.duration || 240, prev.currentTime + seconds);
        try {
          audioRef.current?.seek(newTime);
        } catch {}
        return { ...prev, currentTime: newTime };
      });
    },
    []
  );

  const skipBackward = useCallback(
    (seconds = 10) => {
      setState((prev) => {
        const newTime = Math.max(0, prev.currentTime - seconds);
        try {
          audioRef.current?.seek(newTime);
        } catch {}
        return { ...prev, currentTime: newTime };
      });
    },
    []
  );

  const setSpeed = useCallback((speed: number) => {
    try {
      if (audioRef.current && (audioRef.current as any).playbackRate) {
        (audioRef.current as any).playbackRate = speed;
      }
    } catch (err) {
      console.warn('[AudioPlayer] 设置速度失败:', err);
    }
    setState((prev) => ({ ...prev, speed }));
  }, []);

  const setLoopEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      loopEnabled: enabled,
      activeLoopId: enabled ? prev.activeLoopId : null,
    }));
  }, []);

  const setActiveLoop = useCallback(
    (loopId: string | null) => {
      const newLoop = loopId ? loops.find((l) => l.id === loopId) : null;
      if (newLoop) {
        setState((prev) => ({
          ...prev,
          loopEnabled: true,
          activeLoopId: loopId,
          currentTime: newLoop.startTime,
        }));
        try {
          audioRef.current?.seek(newLoop.startTime);
        } catch {}
      } else {
        setState((prev) => ({ ...prev, activeLoopId: null }));
      }
    },
    [loops]
  );

  const reset = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.stop();
      }
    } catch {}
    setState({
      isPlaying: false,
      currentTime: 0,
      duration: state.duration,
      speed: 1,
      loopEnabled: false,
      activeLoopId: null,
      isLoading: false,
      isSeeking: false,
    });
  }, [state.duration]);

  return {
    ...state,
    play,
    pause,
    togglePlay,
    seek,
    skipForward,
    skipBackward,
    setSpeed,
    setLoopEnabled,
    setActiveLoop,
    reset,
  };
}

export { SAMPLE_AUDIO_URLS };
