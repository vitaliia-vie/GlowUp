import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientHome() {
  const { profile, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hi, {profile?.displayName} 👋</Text>
      <Text style={styles.subtitle}>Client home — booking calendar goes here next.</Text>

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#FFF8F9' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#8A8384', textAlign: 'center', marginBottom: 32 },
  button: { backgroundColor: '#FF8FB1', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
});