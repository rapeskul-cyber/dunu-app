// Profile / account — Google sign-in so the habit streak follows the user
// across devices. Honest about state: when no OAuth client id is configured the
// screen says so and shows the exact redirect URI to register.

import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, SANS, SERIF, Eyebrow, Divider, Meta, TapCard } from '../components/ui';
import { IconChevronLeft, IconFlame, IconCheck } from '../components/Icons';
import { useT } from '../theme/ThemeProvider';
import { SP, TYPE } from '../../core/theme/tokens';
import { useData } from '../store/stores';
import { useAccount, syncId } from '../store/accountStore';
import { useGoogleAuth, googleRedirectUri, IS_CONFIGURED } from '../../core/auth/google';

export function ProfileScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { streak, checkinsToday } = useData();
  const { profile, restore, signIn, signOut } = useAccount();
  const auth = useGoogleAuth();

  useEffect(() => {
    void restore();
  }, [restore]);

  // attach the decoded profile to the account store once OAuth succeeds
  useEffect(() => {
    if (auth.profile) void signIn(auth.profile);
  }, [auth.profile, signIn]);

  const doneCount = Object.keys(checkinsToday).length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + SP.md, paddingHorizontal: SP.lg, paddingBottom: 130 }}>
        <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Kembali"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SP.md }}>
          <IconChevronLeft size={20} color={t.textMuted} />
          <Text style={[SANS('500'), { color: t.textMuted, fontSize: TYPE.caption }]}>Beranda</Text>
        </Pressable>

        <Eyebrow>Akun</Eyebrow>
        <Text style={[SERIF('600'), { color: t.text, fontSize: TYPE.display, letterSpacing: -0.5 }]}>Profil</Text>

        {/* ---- identity card ---- */}
        <View style={{ marginTop: SP.xl, backgroundColor: t.surface, borderRadius: SP.r.lg, padding: SP.lg }}>
          {profile ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[SERIF('600'), { color: t.onPrimary, fontSize: TYPE.title }]}>
                  {(profile.name ?? '?').trim().slice(0, 1).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: SP.md }}>
                <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.body }]}>{profile.name}</Text>
                <Meta>{profile.email}</Meta>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <IconCheck size={14} color={t.success} />
                <Text style={[SANS('600'), { color: t.success, fontSize: TYPE.micro }]}>Tersambung</Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.body }]}>Belum masuk</Text>
              <Text style={[SANS('400'), { color: t.textMuted, fontSize: TYPE.caption, marginTop: SP.xs, lineHeight: TYPE.caption * 1.6 }]}>
                Zikir, tasbih, dan mushaf tetap tersimpan di perangkat ini. Masuk dengan Google
                supaya runtutan (streak) dan catatan harian ikut terbawa kalau ganti HP.
              </Text>

              <Pressable
                onPress={() => void auth.signIn()}
                disabled={!IS_CONFIGURED || !auth.ready}
                accessibilityRole="button"
                accessibilityLabel="Masuk dengan Google"
                accessibilityState={{ disabled: !IS_CONFIGURED }}
                style={({ pressed }) => ({
                  marginTop: SP.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: SP.sm, paddingVertical: SP.md, borderRadius: SP.r.md,
                  backgroundColor: IS_CONFIGURED ? t.primary : t.surfaceHi,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={[SANS('600'), {
                  color: IS_CONFIGURED ? t.onPrimary : t.textFaint,
                  fontSize: TYPE.caption,
                }]}>
                  {IS_CONFIGURED ? 'Masuk dengan Google' : 'Google Sign-In belum dikonfigurasi'}
                </Text>
              </Pressable>

              {auth.error && (
                <Text style={[SANS('400'), { color: t.danger, fontSize: TYPE.micro, marginTop: SP.sm }]}>{auth.error}</Text>
              )}
            </>
          )}
        </View>

        {/* ---- streak summary ---- */}
        <View style={{ marginTop: SP.lg, backgroundColor: t.surface, borderRadius: SP.r.lg, padding: SP.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconFlame size={20} color={t.accent} />
            <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.body, marginLeft: SP.md, flex: 1 }]}>
              Runtutan harian
            </Text>
            <Text style={[SERIF('600'), { color: t.text, fontSize: TYPE.headline }]}>{streak}</Text>
          </View>
          <Divider mt={SP.md} mb={SP.md} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Meta>Hari ini</Meta>
              <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.title, marginTop: 2 }]}>{doneCount} zikir</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Meta>ID sinkronisasi</Meta>
              <Text style={[SANS('500'), { color: t.textMuted, fontSize: TYPE.caption, marginTop: 2 }]}>
                {syncId(profile)}
              </Text>
            </View>
          </View>
        </View>

        {/* ---- honest setup instructions when unconfigured ---- */}
        {!IS_CONFIGURED && (
          <View style={{ marginTop: SP.lg, backgroundColor: t.surface, borderRadius: SP.r.lg, padding: SP.lg }}>
            <Eyebrow>Aktifkan Google Sign-In</Eyebrow>
            <Text style={[SANS('400'), { color: t.textMuted, fontSize: TYPE.caption, lineHeight: TYPE.caption * 1.65 }]}>
              1. Buka Google Cloud Console → APIs & Services → Credentials{'\n'}
              2. Buat OAuth client ID tipe “Web application”{'\n'}
              3. Daftarkan redirect URI di bawah ini (persis, tanpa diubah){'\n'}
              4. Salin Client ID ke app.json → extra.googleClientId, lalu deploy ulang
            </Text>
            <Pressable
              onPress={() => void Linking.openURL('https://console.cloud.google.com/apis/credentials')}
              accessibilityRole="link"
              style={{ marginTop: SP.md }}
            >
              <Text style={[SANS('600'), { color: t.accent, fontSize: TYPE.micro }]}>
                Buka Google Cloud Console →
              </Text>
            </Pressable>
            <View style={{ marginTop: SP.md, backgroundColor: t.bgElevated, borderRadius: SP.r.sm, padding: SP.md }}>
              <Meta>Redirect URI</Meta>
              <Text selectable style={[SANS('400'), { color: t.text, fontSize: TYPE.micro, marginTop: 4 }]}>
                {googleRedirectUri}
              </Text>
            </View>
          </View>
        )}

        {profile && (
          <Pressable
            onPress={() => void signOut()}
            accessibilityRole="button"
            style={({ pressed }) => ({
              marginTop: SP.lg, paddingVertical: SP.md, borderRadius: SP.r.md,
              borderWidth: 1, borderColor: t.border, alignItems: 'center', opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={[SANS('600'), { color: t.danger, fontSize: TYPE.caption }]}>Keluar</Text>
          </Pressable>
        )}

        <TapCard onPress={onBack} ariaLabel="Kembali ke beranda" style={{ marginTop: SP.lg, padding: SP.md, backgroundColor: 'transparent', borderWidth: 1, borderColor: t.border }}>
          <Text style={[SANS('500'), { color: t.textMuted, fontSize: TYPE.caption, textAlign: 'center' }]}>
            Kembali
          </Text>
        </TapCard>
      </ScrollView>
    </Screen>
  );
}
