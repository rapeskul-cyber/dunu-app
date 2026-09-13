// Haptic feedback adapter. Web has no native haptics, so calls degrade safely
// (Vibration API where available) while native runs the intended patterns.

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { HapticKind } from '../../domain/tasbih';
import { TARGET_PATTERN } from '../../domain/tasbih';

const isWeb = Platform.OS === 'web';

export async function fireHaptic(kind: HapticKind): Promise<void> {
  if (isWeb) {
    try {
      const nav = (globalThis as { navigator?: Navigator & { vibrate?: (p: number | number[]) => boolean } })
        .navigator;
      nav?.vibrate?.(kind === 'targetReached' ? TARGET_PATTERN : 15);
    } catch {
      /* ignore */
    }
    return;
  }

  try {
    switch (kind) {
      case 'tick':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      case 'undo':
        await Haptics.selectionAsync();
        return;
      case 'reset':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
      case 'targetReached':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
    }
  } catch {
    // Haptics can be unavailable (emulators, permissions) - never crash the tap loop.
  }
}
