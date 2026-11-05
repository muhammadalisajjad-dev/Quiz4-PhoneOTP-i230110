import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { MessageCard } from '../../components/MessageCard';
import { mapAuthError } from '../../lib/errors';
import { getOtpSession, updateConfirmation, clearOtpSession } from '../../lib/otpSession';
import { resetVerifier, sendOtp, verifyOtp } from '../../lib/phoneAuth';
import { colors, spacing } from '../../theme';

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ display?: string }>();
  const session = getOtpSession();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [message, setMessage] = useState<{ kind: 'error' | 'success' | 'info'; message: string; hint?: string } | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  if (!session) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View style={styles.emptyWrap}>
          <Text style={styles.title}>No active verification</Text>
          <Text style={styles.subtitle}>
            Request a code from the phone screen first. Verification sessions are kept only in memory.
          </Text>
          <Button title="Go to phone entry" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  const display = params.display ?? session.display;

  const handleVerify = async () => {
    setMessage(null);
    if (!session.confirmation) {
      setMessage({ kind: 'error', message: 'No verification request is active.', hint: 'Go back and request a new code.' });
      return;
    }
    if (code.length !== 6) {
      setMessage({ kind: 'error', message: 'Enter the 6-digit code.' });
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(session.confirmation, code);
      clearOtpSession();
      router.replace({ pathname: '/success', params: { display } });
    } catch (e) {
      const mapped = mapAuthError(e);
      setMessage({ kind: 'error', message: mapped.message, hint: mapped.hint });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setMessage(null);
    setResending(true);
    try {
      resetVerifier();
      const confirmation = await sendOtp(session.e164);
      updateConfirmation(confirmation);
      setSecondsLeft(60);
      setCode('');
      setMessage({
        kind: 'info',
        message: 'Firebase accepted a new verification request.',
        hint: 'Check the message for the new code. Firebase test numbers use the console-defined code and do not send an SMS.',
      });
    } catch (e) {
      const mapped = mapAuthError(e);
      setMessage({ kind: 'error', message: mapped.message, hint: mapped.hint });
    } finally {
      setResending(false);
    }
  };

  const handleChangeNumber = () => {
    resetVerifier();
    clearOtpSession();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              onPress={handleChangeNumber}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Text style={styles.backText}>← Change number</Text>
            </Pressable>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>
              We requested a code for <Text style={styles.phone}>{display}</Text> via Firebase.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>6-digit code</Text>
            <TextInput
              value={code}
              onChangeText={(value) => {
                setCode(value.replace(/[^0-9]/g, '').slice(0, 6));
                if (message?.kind === 'error') setMessage(null);
              }}
              placeholder="••••••"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp",
              maxLength={6}
              autoFocus
              style={styles.otpInput}
            />

            <View style={styles.buttonWrap}>
              <Button
                title="Verify OTP"
                onPress={handleVerify}
                loading={loading}
                disabled={code.length !== 6}
              />
            </View>

            <View style={styles.resendRow}>
              {secondsLeft > 0 ? (
                <Text style={styles.resendTimer}>Resend code available in {secondsLeft}s</Text>
              ) : (
                <Pressable
                  onPress={handleResend}
                  disabled={resending}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.resendButton, pressed && styles.pressed]}
                >
                  {resending ? (
                    <Text style={styles.resendLink}>Requesting…</Text>
                  ) : (
                    <Text style={styles.resendLink}>Resend code</Text>
                  )}
                </Pressable>
              )}
            </View>

            {message ? (
              <MessageCard kind={message.kind} message={message.message} hint={message.hint} />
            ) : null}
          </View>

          <MessageCard
            kind="info"
            message="Where is my code?"
            hint="If you configured a Firebase test phone number, no SMS is sent — enter the code defined in Firebase Console → Authentication → Sign-in method → Phone numbers for testing. Real SMS requires the Blaze pay-as-you-go plan."
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingRight: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  pressed: {
    opacity: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  phone: {
    color: colors.text,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.bg,
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 10,
    paddingVertical: 14,
  },
  buttonWrap: {
    marginTop: spacing.xs,
  },
  resendRow: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  resendTimer: {
    fontSize: 13,
    color: colors.textMuted,
  },
  resendButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyWrap: {
    padding: spacing.lg,
    gap: spacing.md,
    justifyContent: 'center',
    flex: 1,
  },
});
