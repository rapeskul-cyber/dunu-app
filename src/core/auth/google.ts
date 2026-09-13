// Google Sign-In via expo-auth-session (OAuth 2.0 + PKCE).
//
// SETUP (one time, ~2 minutes):
//   1. https://console.cloud.google.com/apis/credentials -> Create credentials
//      -> OAuth client ID -> Web application
//   2. Authorized redirect URIs: add the value `googleRedirectUri` prints below
//      (it is also shown at runtime in the account screen when unconfigured).
//   3. Paste the client id into app.json -> extra.googleClientId
//
// Until a client id is present the UI stays fully usable in local-only mode,
// which is honest: streak sync needs an account, the app itself does not.

import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleProfile {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

export const GOOGLE_CLIENT_ID: string =
  (Constants.expoConfig?.extra as { googleClientId?: string } | undefined)?.googleClientId ?? '';

export const IS_CONFIGURED = GOOGLE_CLIENT_ID.length > 0;

/** Redirect URI must be registered verbatim in the Google Cloud console. */
export const googleRedirectUri = AuthSession.makeRedirectUri({
  scheme: 'dozir',
  path: 'auth',
  preferLocalhost: Platform.OS === 'web',
});

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

/** Minimal base64 -> binary-string decoder that works on every platform.
 *  (atob is web-only, expo-crypto has no base64 decoder.) */
const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64ToBinary(b64: string): string {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  let out = '';
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64_ALPHABET.indexOf(clean[i]);
    const c1 = B64_ALPHABET.indexOf(clean[i + 1]);
    const c2 = B64_ALPHABET.indexOf(clean[i + 2]);
    const c3 = B64_ALPHABET.indexOf(clean[i + 3]);
    out += String.fromCharCode((c0 << 2) | (c1 >> 4));
    if (c2 >= 0) out += String.fromCharCode(((c1 & 15) << 4) | (c2 >> 2));
    if (c3 >= 0) out += String.fromCharCode(((c2 & 3) << 6) | c3);
  }
  return out;
}

/** Decode the id_token payload (JWT middle segment).
 *
 *  SECURITY NOTE: a client-side app cannot verify the token's RSA signature
 *  without a server, so this is NOT an authorisation boundary — the app has no
 *  server-side privilege to gain, and all data is local-first. What we DO
 *  enforce is claim sanity, so a token minted for a different audience, a
 *  forged issuer, or an expired session cannot be used to attach an identity:
 *    iss   must be Google
 *    aud   must be this client id
 *    exp   must be in the future
 *  If a privileged backend is ever added, validate the token there instead.
 */
function decodeIdToken(idToken: string, expectedAud: string): GoogleProfile | null {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const bin = base64ToBinary(b64);
    const json = decodeURIComponent(
      bin
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const p = JSON.parse(json) as {
      sub?: string;
      name?: string;
      email?: string;
      picture?: string;
      iss?: string;
      aud?: string;
      exp?: number;
    };
    const issOk = p.iss === 'https://accounts.google.com' || p.iss === 'accounts.google.com';
    const audOk = !!expectedAud && p.aud === expectedAud;
    const expOk = typeof p.exp === 'number' && p.exp * 1000 > Date.now();
    if (!issOk || !audOk || !expOk) return null;
    if (!p.sub || !p.name) return null;
    return { sub: p.sub, name: p.name, email: p.email ?? '', picture: p.picture };
  } catch {
    return null;
  }
}

export function useGoogleAuth() {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: googleRedirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: true,
    },
    discovery,
  );

  const profile = React.useMemo<GoogleProfile | null>(() => {
    if (response?.type !== 'success') return null;
    const idToken = response.params?.id_token;
    return idToken ? decodeIdToken(idToken, GOOGLE_CLIENT_ID) : null;
  }, [response]);

  return {
    ready: !!request,
    configured: IS_CONFIGURED,
    profile,
    error: response?.type === 'error' ? response.error?.message ?? 'Gagal masuk' : null,
    cancelled: response?.type === 'dismiss' || response?.type === 'cancel',
    signIn: async () => {
      if (!IS_CONFIGURED) return { ok: false as const, reason: 'unconfigured' as const };
      const res = await promptAsync();
      return { ok: res.type === 'success', reason: res.type };
    },
  };
}
