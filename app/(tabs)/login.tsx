// app/(tabs)/login.tsx
import { Link, useRouter } from 'expo-router';
import {
  Platform,
  ActivityIndicator,
  Alert,
  Button,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { setAppUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tint = Colors[colorScheme ?? 'light'].tint;

  const bg = isDark ? '#0B0B0B' : '#FFFFFF';
  const text = isDark ? '#FFFFFF' : '#111111';
  const sub = isDark ? '#B5B5B5' : '#444444';
  const inputBg = isDark ? '#161616' : '#FFFFFF';
  const border = isDark ? '#2B2B2B' : '#DADADA';
  const placeholder = isDark ? '#7A7A7A' : '#9A9A9A';

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '656233021-96b5to7mns3vg9ol9errel25iefbtek3.apps.googleusercontent.com',
      offlineAccess: false,
    });
  }, []);

  const showMessage = (title: string, msg: string) => {
    if (Platform.OS === 'web') alert(`${title}\n\n${msg}`);
    else Alert.alert(title, msg);
  };

  const onLogin = async () => {
    if (busy) return;
    const mail = email.trim();
    const pass = password;
    if (!mail && !pass) return showMessage('Brak danych', 'Podaj e-mail i hasło.');
    if (!mail) return showMessage('Brak e-maila', 'Podaj adres e-mail.');
    if (!isEmail(mail)) return showMessage('Nieprawidłowy e-mail', 'Sprawdź format adresu e-mail.');
    if (!pass) return showMessage('Brak hasła', 'Podaj hasło.');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, mail, pass);
      // Firebase onAuthStateChanged przechwyci i ustawi user w kontekście
      router.push('/(tabs)/profile'); // push jest bezpieczniejszy
    } catch (e: any) {
      showMessage('Błąd logowania', e?.code ?? 'Nieznany błąd');
    } finally {
      setBusy(false);
    }
  };

  const onGooglePress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const res = await GoogleSignin.signIn();
      // res ma kształt SignInResponse — pole z danymi użytkownika jest teraz w res.user lub res (zależnie od wersji)
      const g = (res as any).user ?? (res as any).data ?? res;
      const appUser = {
        id: g.id ?? g.user?.id ?? null,
        email: g.email ?? g.user?.email ?? null,
        name: g.name ?? g.user?.name ?? g.user?.givenName ?? null,
        photo: g.photo ?? g.user?.photo ?? g.user?.photoUrl ?? null,
        provider: 'google' as const,
      };

      // ustaw user w kontekscie i pamiętaj w AsyncStorage (setAppUser robi to)
      await setAppUser(appUser);

      // pokaż krótko sukces i przekieruj — używaj push, nie replace
      Alert.alert('Sukces', `Zalogowano jako ${appUser.name ?? appUser.email ?? 'użytkownik'}`);
      router.push('/(tabs)/profile');
    } catch (error: any) {
      console.error('[AUTH] Google Sign-In Error', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled login');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Signin in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showMessage('Błąd', 'Google Play Services niedostępne na tym urządzeniu.');
      } else {
        showMessage('Błąd', 'Nie udało się zalogować przez Google.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg, padding: 20, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: text, marginBottom: 8 }}>Logowanie</Text>

      <Text style={{ color: sub }}>Email</Text>
      <TextInput
        placeholder="np. jan@kowalski.pl"
        placeholderTextColor={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ color: text, backgroundColor: inputBg, borderWidth: 1, borderColor: border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}
      />

      <Text style={{ color: sub, marginTop: 6 }}>Hasło</Text>
      <TextInput
        placeholder="••••••••"
        placeholderTextColor={placeholder}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ color: text, backgroundColor: inputBg, borderWidth: 1, borderColor: border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}
      />

      <View style={{ marginTop: 12 }}>
        {busy ? <ActivityIndicator /> : (
          <>
            <Button title="Zaloguj" onPress={onLogin} color={tint} />
            <View style={{ height: 12 }} />
            <GoogleSigninButton
              style={{ width: '100%', height: 48 }}
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Dark}
              onPress={onGooglePress}
            />
          </>
        )}
      </View>

      <Text style={{ color: sub, marginTop: 16 }}>
        Nie masz konta?{' '}
        <Link href="/(tabs)/register" style={{ color: tint, fontWeight: '700' }}>
          Zarejestruj się
        </Link>
      </Text>
    </View>
  );
}
