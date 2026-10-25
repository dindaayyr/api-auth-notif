
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>✓</Text>
      </View>

      <Text style={styles.title}>TaskMe</Text>
      <Text style={styles.subtitle}>Your tasks, your way.</Text>

      <Text style={styles.description}>
        Organize your tasks, manage your day,
        and never miss an important update.
      </Text>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => router.push('/login')}
      >
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => router.push('/register')}
      >
        <Text style={styles.registerText}>Register</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Stay productive with TaskMe
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F8',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#FADCE8',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#D94F83',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#D94F83',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#654454',
    textAlign: 'center',
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: '#8A7580',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 16,
    marginBottom: 34,
  },
  loginButton: {
    backgroundColor: '#D94F83',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D94F83',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerText: {
    color: '#D94F83',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    fontSize: 12,
    color: '#B59AA7',
    textAlign: 'center',
    marginTop: 28,
  },
});
