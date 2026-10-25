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
import { registerUser } from '../api';

export default function RegisterScreen() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!nama.trim() || !email.trim() || !password) {
      Alert.alert(
        'Perhatian',
        'Semua kolom wajib diisi.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Perhatian',
        'Password minimal 6 karakter.'
      );
      return;
    }

    try {
      setLoading(true);

      await registerUser(
        nama.trim(),
        email.trim(),
        password
      );

      Alert.alert(
        'Registrasi Berhasil',
        'Akun berhasil dibuat. Silakan login.',
        [
          {
            text: 'Login',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Registrasi Gagal',
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        Buat akun untuk mulai menggunakan aplikasi
      </Text>

      <Text style={styles.label}>Nama lengkap</Text>
      <TextInput
        style={styles.input}
        placeholder="Masukkan nama lengkap"
        placeholderTextColor="#999"
        value={nama}
        onChangeText={setNama}
        autoCapitalize="words"
      />

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
          placeholder="Minimal 6 karakter"
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
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Daftar</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Sudah punya akun?{' '}
        </Text>
        <Link href="/" style={styles.link}>
          Login
        </Link>
      </View>
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
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#D94F83',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0C7D7',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 18,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0C7D7',
    borderRadius: 12,
    marginBottom: 18,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#333',
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
    marginTop: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  footerText: {
    color: '#777',
  },
  link: {
    color: '#D94F83',
    fontWeight: 'bold',
  },
});
