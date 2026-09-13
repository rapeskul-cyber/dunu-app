// Action row for the dua reading screen: tasbih jump, bookmark, audio with
// loop + speed control, and the daily habit check-in. Split out from
// DetailScreen so neither file grows unwieldy.

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SANS, TapCard, Meta } from '../components/ui';
import { IconBeads, IconBookmark, IconPlay, IconPause, IconLoop, IconCheck } from '../components/Icons';
import { useT } from '../theme/ThemeProvider';
import { SP, TYPE } from '../../core/theme/tokens';
import { useData, useAudio, nextSpeed } from '../store/stores';
import type { DuaWithState } from '../../data/repositories/DuaRepository';

export function DetailActions({
  dua,
  onOpenTasbih,
  onToggleBookmark,
  ready,
}: {
  dua: DuaWithState;
  onOpenTasbih: (id: number) => void;
  onToggleBookmark: () => void;
  ready: boolean;
}) {
  const t = useT();
  const { checkinsToday, checkIn } = useData();
  const { load, toggle, playing, track, rate, setRate } = useAudio();

  const checkedIn = (checkinsToday[dua.id] ?? 0) > 0;
  const isPlaying = playing && track === `dua:${dua.id}`;

  const nextRate = () => {
    void setRate(nextSpeed(rate));
  };

  return (
    <View style={{ paddingHorizontal: SP.lg, marginTop: SP.xl, gap: SP.md }}>
      <View style={{ flexDirection: 'row', gap: SP.md }}>
        <TapCard
          onPress={() => onOpenTasbih(dua.id)}
          ariaLabel={`Hitung dengan tasbih, target ${dua.default_target} kali`}
          style={{ flex: 1, paddingVertical: SP.md, backgroundColor: t.primary, borderRadius: SP.r.md }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm }}>
            <IconBeads size={18} color={t.onPrimary} />
            <Text style={[SANS('600'), { color: t.onPrimary, fontSize: TYPE.caption }]}>
              Hitung · {dua.default_target}×
            </Text>
          </View>
        </TapCard>

        <TapCard
          onPress={onToggleBookmark}
          ariaLabel={dua.is_bookmarked ? 'Hapus simpanan' : 'Simpan doa'}
          style={{ padding: SP.md, borderRadius: SP.r.md, borderWidth: 1, borderColor: t.border }}
        >
          <IconBookmark size={18} color={dua.is_bookmarked ? t.accent : t.textMuted} filled={!!dua.is_bookmarked} />
        </TapCard>
      </View>

      {dua.audio_url ? (
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', gap: SP.md,
            backgroundColor: t.surface, borderRadius: SP.r.md, paddingVertical: SP.md, paddingHorizontal: SP.md,
          }}
        >
          <Pressable
            onPress={() => void (isPlaying ? toggle() : load(`dua:${dua.id}`, dua.audio_url, dua.title))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Jeda murattal' : 'Putar murattal'}
            style={{ flexDirection: 'row', alignItems: 'center', gap: SP.sm, flex: 1 }}
          >
            {isPlaying ? <IconPause size={18} color={t.text} /> : <IconPlay size={18} color={t.text} />}
            <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.caption }]}>
              {isPlaying ? 'Sedang diputar' : 'Putar murattal'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void setRate(nextSpeed(rate))}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Ubah kecepatan, saat ini ${rate} kali`}
            style={{ paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: SP.r.chip, borderWidth: 1, borderColor: t.border }}
          >
            <Text style={[SANS('600'), { color: t.textMuted, fontSize: TYPE.micro }]}>{rate}×</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={() => {
          if (!checkedIn) void checkIn(dua.id);
        }}
        accessibilityRole="button"
        accessibilityLabel={checkedIn ? 'Sudah dibaca hari ini' : 'Tandai sudah dibaca'}
        accessibilityState={{ disabled: checkedIn }}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm,
          paddingVertical: SP.md, borderRadius: SP.r.md,
          borderWidth: 1,
          borderColor: checkedIn ? 'transparent' : t.border,
          backgroundColor: checkedIn ? t.surface : 'transparent',
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <IconCheck size={17} color={checkedIn ? t.success : t.textMuted} />
        <Text style={[SANS('600'), { color: checkedIn ? t.success : t.textMuted, fontSize: TYPE.caption }]}>
          {checkedIn ? 'Sudah dibaca hari ini' : 'Tandai sudah dibaca'}
        </Text>
      </Pressable>

      {!ready && <Meta>memuat…</Meta>}
    </View>
  );
}
