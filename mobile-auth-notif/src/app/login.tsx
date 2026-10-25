import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { loginUser } from '../api';
import { setupPushNotifications } from '../notifications';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        'Perhatian',
        'Email dan password wajib diisi.'
      );
      return;
    }

    try {
      setLoading(true);

      const result = await loginUser(
        email.trim(),
        password
      );

      if (!result.token) {
        throw new Error(
          'Token tidak ditemukan dari server.'
        );
      }

      await SecureStore.setItemAsync(
        'token',
        result.token
      );

      // Push notification bersifat opsional.
      try {
        await setupPushNotifications(result.token);
      } catch (notificationError) {
        console.warn(
          'Gagal menyiapkan push notification:',
          notificationError
        );
      }

      Alert.alert(
        'Login Berhasil',
        `Selamat datang, ${result.user?.nama ?? 'Pengguna'}!`,
        [
          {
            text: 'Lanjutkan',
            onPress: () => router.replace('/tasks'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Login Gagal',
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan. Silakan coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>✓</Text>
        </View>

        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>
          Login ke akun TaskMe kamu
        </Text>
      </View>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Masukkan email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Masukkan password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() =>
            setShowPassword((prev) => !prev)
          }
          accessibilityRole="button"
          accessibilityLabel={
            showPassword
              ? 'Sembunyikan password'
              : 'Lihat password'
          }
        >
          {showPassword ? (
            <EyeOff size={21} color="#D94F83" />
          ) : (
            <Eye size={21} color="#D94F83" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.buttonDisabled,
        ]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <View style={styles.registerRow}>
        <Text style={styles.registerText}>
          Belum punya akun?{' '}
        </Text>
        <Link href="/register" style={styles.registerLink}>
          Daftar
        </Link>
      </View>

      <Link href="/" style={styles.backLink}>
        Kembali ke halaman awal
      </Link>

      <Text style={styles.footer}>
        Stay productive with TaskMe
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#FFF5F8',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#FADCE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  icon: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#D94F83',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#D94F83',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0C7D7',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 20,
    color: '#333333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0C7D7',
    borderRadius: 12,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#333333',
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: '#D94F83',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  registerText: {
    color: '#777777',
    fontSize: 14,
  },
  registerLink: {
    color: '#D94F83',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backLink: {
    color: '#D94F83',
    textAlign: 'center',
    marginTop: 22,
    fontSize: 13,
  },
  footer: {
    color: '#B59AA7',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 28,
  },
});