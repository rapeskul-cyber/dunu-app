// =============================================================================
// PHASE 2 - Smart Tasbih Counter engine
// Pure, framework-free logic so it is unit-testable and deterministic.
// =============================================================================

export type HapticKind =
  | 'tick' // light impact per tap
  | 'targetReached' // success notification + distinct pattern
  | 'reset' // medium impact
  | 'undo'; // selection

export interface TasbihState {
  duaId: number;
  current: number;
  target: number;
  cycles: number; // how many times the target has been completed
}

export interface TasbihEvent {
  type: 'increment' | 'decrement' | 'reset' | 'target' | 'noop';
  state: TasbihState;
  haptic: HapticKind | null;
  /** Fired exactly once per completion, for auto-advance hooks. */
  autoAdvance?: boolean;
}

export const createTasbih = (
  duaId: number,
  target = 33,
  current = 0,
  cycles = 0,
): TasbihState => ({
  duaId,
  current: Math.max(0, Math.floor(current)),
  target: Math.max(1, Math.floor(target)),
  cycles: Math.max(0, Math.floor(cycles)),
});

export function increment(s: TasbihState): TasbihEvent {
  const next = s.current + 1;
  if (next >= s.target) {
    return {
      type: 'target',
      state: { ...s, current: 0, cycles: s.cycles + 1 },
      haptic: 'targetReached',
      autoAdvance: true,
    };
  }
  return { type: 'increment', state: { ...s, current: next }, haptic: 'tick' };
}

export function decrement(s: TasbihState): TasbihEvent {
  if (s.current <= 0) {
    if (s.cycles === 0) return { type: 'noop', state: s, haptic: null };
    return {
      type: 'decrement',
      state: { ...s, cycles: s.cycles - 1, current: s.target - 1 },
      haptic: 'undo',
    };
  }
  return { type: 'decrement', state: { ...s, current: s.current - 1 }, haptic: 'undo' };
}

export function reset(s: TasbihState): TasbihEvent {
  return { type: 'reset', state: { ...s, current: 0 }, haptic: 'reset' };
}

/** Full reset, also clears banked cycles (long-press reset). */
export function resetAll(s: TasbihState): TasbihEvent {
  return { type: 'reset', state: { ...s, current: 0, cycles: 0 }, haptic: 'reset' };
}

export function setTarget(s: TasbihState, target: number): TasbihEvent {
  const t = Math.max(1, Math.floor(target));
  const current = s.current >= t ? 0 : s.current;
  return { type: 'reset', state: { ...s, target: t, current }, haptic: 'undo' };
}

/** 0..1 progress used by the ring UI. */
export const progress = (s: TasbihState): number =>
  s.target <= 0 ? 0 : Math.min(1, s.current / s.target);

/** Common dhikr targets offered by the target switcher. */
export const TARGET_PRESETS = [3, 7, 10, 33, 34, 99, 100, 1000];

/** Distinct vibration pattern for completion (ms on/off), used on Android. */
export const TARGET_PATTERN = [0, 45, 80, 45, 80, 120];
