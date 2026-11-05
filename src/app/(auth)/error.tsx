import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { colors, spacing } from '../../theme';

export default function ErrorScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>!</Text>
        </View>
        <Text style={styles.title}>Verification failed</Text>
        <Text style={styles.subtitle}>
          The code was not accepted, or the request could not be completed. Go back and request a new code.
        </Text>
        <View style={styles.actions}>
          <Button title="Back to phone entry" onPress={() => router.replace('/')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.errorSoft,
    borderWidth: 2,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  icon: {
    fontSize: 44,
    color: colors.error,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actions: {
    marginTop: spacing.sm,
  },
});
