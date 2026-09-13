// Category list — pushed view, no tab bar. Rows are typographic, grouped under
// the category name with its icon drawn (never an emoji).

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, SERIF, SANS, NASKH, Eyebrow, Divider, Meta } from '../components/ui';
import { IconChevronLeft, IconBookmark } from '../components/Icons';
import { useT } from '../theme/ThemeProvider';
import { SP, TYPE } from '../../core/theme/tokens';
import { useData } from '../store/stores';

export function CategoryScreen({
  slug,
  onBack,
  onOpenDua,
}: {
  slug: string;
  onBack: () => void;
  onOpenDua: (id: number) => void;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { categories, getDuasByCategory, toggleBookmark, bookmarks } = useData();
  const [list, setList] = useState<any[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await getDuasByCategory(slug);
      if (alive) setList(rows);
    })();
    return () => {
      alive = false;
    };
  }, [slug, getDuasByCategory]);

  const cat = categories.find((c) => c.slug === slug);

  return (
    <Screen>
      <View style={{ paddingTop: insets.top + SP.md, paddingHorizontal: SP.lg }}>
        <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Kembali ke beranda"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SP.md }}>
          <IconChevronLeft size={20} color={t.textMuted} />
          <Text style={[SANS('500'), { color: t.textMuted, fontSize: TYPE.caption }]}>Beranda</Text>
        </Pressable>

        <Eyebrow>Kategori</Eyebrow>
        <Text style={[SERIF('600'), { color: t.text, fontSize: TYPE.display, letterSpacing: -0.4 }]}>
          {cat?.name ?? slug}
        </Text>
        {list && <Meta>{list.length} doa & zikir</Meta>}
        <Divider mt={SP.md} />
      </View>

      {list === null ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(d) => String(d.id)}
          contentContainerStyle={{ paddingHorizontal: SP.lg, paddingBottom: 120 }}
          renderItem={({ item, index }) => {
            const isBm = bookmarks.some((b) => b.id === item.id);
            return (
              <View>
                <Pressable
                  onPress={() => onOpenDua(item.id)}
                  onLongPress={() => void toggleBookmark(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}, target ${item.default_target} kali`}
                  style={({ pressed }) => ({ paddingVertical: SP.lg, opacity: pressed ? 0.6 : 1 })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[SANS('400'), { color: t.textFaint, fontSize: TYPE.micro, width: 26 }]}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.body }]}>{item.title}</Text>
                        {isBm && <IconBookmark size={13} color={t.accent} filled />}
                      </View>
                      <Text style={[SANS('400'), { color: t.textFaint, fontSize: TYPE.micro, marginTop: 2 }]}>
                        {item.hadith_grade} · target {item.default_target}×
                      </Text>
                    </View>
                  </View>

                  <Text
                    numberOfLines={2}
                    style={[
                      NASKH('400'),
                      { color: t.textMuted, fontSize: 20, lineHeight: 38, textAlign: 'right', writingDirection: 'rtl', marginTop: SP.sm },
                    ]}
                  >
                    {item.arabic}
                  </Text>
                </Pressable>
                {index < list.length - 1 && <Divider />}
              </View>
            );
          }}
          initialNumToRender={10}
        />
      )}
    </Screen>
  );
}
