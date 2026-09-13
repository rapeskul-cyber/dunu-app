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

/** Decode the id_token payload (JWT middle segment) — no verification needed
 *  for local display; the token is only used to read the user's own profile. */
function decodeIdToken(idToken: string): GoogleProfile | null {
  try {
    const payload = idToken.split('.')[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const p = JSON.parse(json) as { sub: string; name: string; email: string; picture?: string };
    return { sub: p.sub, name: p.name, email: p.email, picture: p.picture };
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
    return idToken ? decodeIdToken(idToken) : null;
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
