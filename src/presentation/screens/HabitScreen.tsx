// Habit — daily check-ins + streak, drawn as a text-forward ledger. Distinguishes
// "loading" from "empty" so the screen never lies about having no data.

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, SANS, SERIF, Eyebrow, Divider, Meta } from '../components/ui';
import { IconFlame, IconCheck } from '../components/Icons';
import { useT } from '../theme/ThemeProvider';
import { SP, TYPE } from '../../core/theme/tokens';
import { useData, todayKey } from '../store/stores';

const GOAL = 3;

export function HabitScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { repo, refreshHabit, streak, checkinsToday } = useData();
  const [rows, setRows] = useState<{ id: number; title: string; count: number }[] | null>(null);
  const today = todayKey();

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!repo) return;
      await refreshHabit();
      const checkins = await repo.getCheckins(today);
      const items = await Promise.all(
        checkins.map(async (r) => {
          const d = await repo.getDua(r.dua_id);
          return { id: r.dua_id, title: d?.title ?? `Dua #${r.dua_id}`, count: r.count };
        }),
      );
      if (alive) setRows(items);
    })();
    return () => {
      alive = false;
    };
  }, [repo, refreshHabit, today]);

  const done = rows?.length ?? 0;
  const pct = Math.min(100, Math.round((done / GOAL) * 100));

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + SP.lg, paddingHorizontal: SP.lg, paddingBottom: 130 }}>
        <Eyebrow>{today}</Eyebrow>
        <Text style={[SERIF('600'), { color: t.text, fontSize: TYPE.display, letterSpacing: -0.5 }]}>
          Kebiasaan Harian
        </Text>

        <View style={{ marginTop: SP.xl, backgroundColor: t.surface, borderRadius: SP.r.lg, padding: SP.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View>
              <Text style={[SANS('500'), { color: t.textMuted, fontSize: TYPE.micro, letterSpacing: 0.8, textTransform: 'uppercase' }]}>
                Target harian
              </Text>
              <Text style={[SERIF('600'), { color: t.text, fontSize: 44, letterSpacing: -1, marginTop: 2 }]}>
                {done}
                <Text style={[SANS('500'), { color: t.textFaint, fontSize: TYPE.title }]}> / {GOAL} zikir</Text>
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <IconFlame size={17} color={t.accent} />
                <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.title }]}>{streak}</Text>
              </View>
              <Meta>hari beruntun</Meta>
            </View>
          </View>

          <View style={{ height: 6, borderRadius: 3, backgroundColor: t.ringTrack, marginTop: SP.lg, overflow: 'hidden' }}>
            <View style={{ height: 6, width: `${pct}%`, backgroundColor: t.ringProgress, borderRadius: 3 }} />
          </View>
          <Text style={[SANS('400'), { color: t.textMuted, fontSize: TYPE.caption, marginTop: SP.md, lineHeight: TYPE.caption * 1.5 }]}>
            {pct >= 100
              ? 'MasyaAllah, target hari ini tercapai.'
              : rows && done === 0
                ? 'Belum ada catatan hari ini — buka zikir lalu tandai sudah dibaca, atau selesaikan satu putaran tasbih.'
                : `Kurang ${GOAL - done} zikir lagi untuk menutup target.`}
          </Text>
        </View>

        <View style={{ marginTop: SP.xxl }}>
          <Eyebrow>Yang dibaca hari ini</Eyebrow>
          <Divider mb={SP.xs} />

          {rows === null ? (
            <View style={{ paddingVertical: SP.xxl, alignItems: 'center' }}>
              <ActivityIndicator color={t.primary} />
              <Text style={[SANS('400'), { color: t.textMuted, marginTop: SP.sm, fontSize: TYPE.caption }]}>
                Memuat catatan…
              </Text>
            </View>
          ) : rows.length === 0 ? (
            <Text style={[SANS('400'), { color: t.textFaint, fontSize: TYPE.caption, paddingVertical: SP.xl }]}>
              Belum ada catatan hari ini.
            </Text>
          ) : (
            rows.map((r, i) => (
              <View key={r.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: SP.md }}>
                  <IconCheck size={16} color={t.success} />
                  <Text style={[SANS('500'), { color: t.textMuted, fontSize: TYPE.micro, width: 24, marginLeft: SP.xs }]}>
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                  <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.body, flex: 1 }]}>{r.title}</Text>
                  <Text style={[SANS('600'), { color: t.accent, fontSize: TYPE.caption }]}>{r.count}×</Text>
                </View>
                {i < rows.length - 1 && <Divider />}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
