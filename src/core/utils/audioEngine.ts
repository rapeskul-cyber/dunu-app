// Unified audio engine: expo-av on native, HTMLAudioElement on web.
// Exposes one surface with play/pause/seek/loop/rate so UI code stays platform-blind.

import { Platform } from 'react-native';
import type { Audio as ExpoAudio } from 'expo-av';

/** Instance type of `new Audio.Sound()` — avoids importing the value at module scope. */
type Sound = InstanceType<typeof ExpoAudio.Sound>;

export interface EngineStatus {
  playing: boolean;
  positionMs: number;
  durationMs: number;
}

export type StatusListener = (s: EngineStatus) => void;

class NativeEngine {
  private sound: Sound | null = null;
  private listener: StatusListener | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;

  async load(uri: string): Promise<void> {
    await this.unload();
    const { Audio } = await import('expo-av');
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    this.sound = sound;
  }

  setListener(cb: StatusListener | null) {
    this.listener = cb;
    if (cb && !this.interval) {
      this.interval = setInterval(async () => {
        if (!this.sound || !this.listener) return;
        const st = await this.sound.getStatusAsync();
        if (st.isLoaded) {
          this.listener({
            playing: st.isPlaying,
            positionMs: st.positionMillis ?? 0,
            durationMs: st.durationMillis ?? 0,
          });
        }
      }, 250);
    } else if (!cb && this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async play(rate: number, loop: boolean): Promise<void> {
    await this.sound?.setStatusAsync({ shouldPlay: true, rate, isLooping: loop });
  }
  async pause(): Promise<void> {
    await this.sound?.pauseAsync();
  }
  async stop(): Promise<void> {
    await this.sound?.stopAsync();
  }
  async seekTo(ratio: number): Promise<void> {
    if (!this.sound) return;
    const st = await this.sound.getStatusAsync();
    if (st.isLoaded) {
      const dur = st.durationMillis ?? 0;
      await this.sound.setPositionAsync(Math.max(0, Math.min(1, ratio)) * dur);
    }
  }
  async setRate(rate: number): Promise<void> {
    await this.sound?.setStatusAsync({ rate });
  }
  async setLoop(loop: boolean): Promise<void> {
    await this.sound?.setStatusAsync({ isLooping: loop });
  }
  async unload(): Promise<void> {
    try {
      await this.sound?.unloadAsync();
    } catch {
      /* ignore */
    }
    this.sound = null;
  }
  destroy() {
    this.setListener(null);
    void this.unload();
  }
}

class WebEngine {
  private el: HTMLAudioElement | null = null;
  private listener: StatusListener | null = null;
  private tick: number | null = null;

  private ensure(): HTMLAudioElement {
    if (typeof Audio === 'undefined') return null as unknown as HTMLAudioElement;
    if (!this.el) this.el = new Audio();
    return this.el;
  }

  async load(uri: string): Promise<void> {
    const el = this.ensure();
    if (!el) return;
    el.src = uri;
    el.preload = 'auto';
  }

  setListener(cb: StatusListener | null) {
    this.listener = cb;
    if (cb && this.tick === null) {
      this.tick = setInterval(() => {
        const el = this.el;
        if (!el || !this.listener) return;
        this.listener({
          playing: !el.paused && !el.ended,
          positionMs: (el.currentTime || 0) * 1000,
          durationMs: (el.duration || 0) * 1000,
        });
      }, 250) as unknown as number;
    } else if (!cb && this.tick !== null) {
      clearInterval(this.tick);
      this.tick = null;
    }
  }

  async play(rate: number, loop: boolean): Promise<void> {
    const el = this.el;
    if (!el) return;
    el.playbackRate = rate;
    el.loop = loop;
    try {
      await el.play();
    } catch {
      /* autoplay blocked - user gesture required */
    }
  }
  async pause(): Promise<void> {
    this.el?.pause();
  }
  async stop(): Promise<void> {
    if (this.el) {
      this.el.pause();
      this.el.currentTime = 0;
    }
  }
  async seekTo(ratio: number): Promise<void> {
    if (this.el && Number.isFinite(this.el.duration)) {
      this.el.currentTime = Math.max(0, Math.min(1, ratio)) * this.el.duration;
    }
  }
  async setRate(rate: number): Promise<void> {
    if (this.el) this.el.playbackRate = rate;
  }
  async setLoop(loop: boolean): Promise<void> {
    if (this.el) this.el.loop = loop;
  }
  async unload(): Promise<void> {
    this.el?.pause();
    if (this.el) this.el.removeAttribute('src');
    this.el = null;
  }
  destroy() {
    this.setListener(null);
    void this.unload();
  }
}

type Engine = NativeEngine | WebEngine;

let _engine: Engine | null = null;

export function getAudioEngine(): Engine {
  if (!_engine) _engine = Platform.OS === 'web' ? new WebEngine() : new NativeEngine();
  return _engine;
}

export function destroyAudioEngine() {
  _engine?.destroy();
  _engine = null;
}
