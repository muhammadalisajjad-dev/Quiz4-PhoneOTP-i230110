import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { MessageCard } from '../../components/MessageCard';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { clearOtpSession } from '../../lib/otpSession';
import { colors, spacing } from '../../theme';

export default function SuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ display?: string }>();
  const [signingOut, setSigningOut] = useState(false);

  const handleAnother = async () => {
    setSigningOut(true);
    try {
      if (auth) await signOut(auth);
    } catch {
      // Sign-out is best-effort; the next verification will replace it anyway.
    } finally {
      clearOtpSession();
      setSigningOut(false);
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Text style={styles.check}>✓</Text>
        </View>

        <Text style={styles.title}>Phone number verified</Text>
        <Text style={styles.subtitle}>
          Firebase accepted the verification code{params.display ? ` for ${params.display}` : ''}.
        </Text>

        <MessageCard
          kind="success"
          message="Verification successful"
          hint="Firebase created a signed-in user for this phone number. This result came from Firebase, not from a simulated local check."
        />

        <MessageCard
          kind="info"
          message="About this demo"
          hint="If you used a Firebase predefined test number, Firebase verified the console-defined code without sending any SMS. Real SMS delivery requires the Blaze plan."
        />

        <View style={styles.actions}>
          <Button title="Verify another number" onPress={handleAnother} loading={signingOut} />
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
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.successSoft,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  check: {
    fontSize: 42,
    color: colors.success,
    fontWeight: '800',
    lineHeight: 48,
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
