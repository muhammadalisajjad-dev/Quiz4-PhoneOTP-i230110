import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { CountryPickerModal } from '../../components/CountryPickerModal';
import { MessageCard } from '../../components/MessageCard';
import {
  DEFAULT_COUNTRY,
  formatNational,
  isValidNationalNumber,
  toE164,
  type Country,
} from '../../lib/countries';
import { mapAuthError } from '../../lib/errors';
import { firebaseInitError, isFirebaseReady } from '../../lib/firebase';
import { setOtpSession } from '../../lib/otpSession';
import { sendOtp } from '../../lib/phoneAuth';
import { colors, spacing } from '../../theme';

export default function PhoneEntryScreen() {
  const router = useRouter();
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [digits, setDigits] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null);

  const handleSend = async () => {
    setError(null);

    if (!isFirebaseReady) {
      setError({ message: firebaseInitError ?? 'Firebase is not configured.' });
      return;
    }

    if (!isValidNationalNumber(digits)) {
      setError({
        message: 'Enter a valid phone number.',
        hint: 'Use 7–15 digits, for example 300 1234567 for Pakistan.',
      });
      return;
    }

    const e164 = toE164(country.dial, digits);
    const display = `${country.flag} +${country.dial} ${formatNational(digits)}`;

    setLoading(true);
    try {
      const confirmation = await sendOtp(e164);
      setOtpSession({ e164, display, confirmation, sentAt: Date.now() });
      router.push({ pathname: '/otp', params: { display } });
    } catch (e) {
      const mapped = mapAuthError(e);
      setError({ message: mapped.message, hint: mapped.hint });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>FIREBASE PHONE AUTH</Text>
            </View>
            <Text style={styles.title}>Phone OTP Verification</Text>
            <Text style={styles.subtitle}>
              Verify your mobile number with a one-time code. Real Firebase phone authentication — no simulated codes.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Phone number</Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => setPickerVisible(true)}
              style={({ pressed }) => [styles.countryRow, pressed && styles.pressed]}
            >
              <Text style={styles.flag}>{country.flag}</Text>
              <View style={styles.countryText}>
                <Text style={styles.countryName}>{country.name}</Text>
                <Text style={styles.countryDial}>+{country.dial}</Text>
              </View>
              <Text style={styles.chevron}>⌄</Text>
            </Pressable>

            <View style={styles.inputRow}>
              <Text style={styles.dialPrefix}>+{country.dial}</Text>
              <TextInput
                value={digits}
                onChangeText={(value) => {
                  setDigits(value.replace(/[^0-9]/g, ''));
                  if (error) setError(null);
                }}
                onSubmitEditing={handleSend}
                placeholder="300 1234567"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={15}
                style={styles.input}
                returnKeyType="done"
              />
            </View>

            <Text style={styles.helper}>
              We send a 6-digit code to this number via Firebase. Standard SMS rates may apply.
            </Text>

            <View style={styles.buttonWrap}>
              <Button
                title="Send OTP"
                onPress={handleSend}
                loading={loading}
                disabled={digits.length === 0}
              />
            </View>

            {error ? (
              <View style={styles.messageWrap}>
                <MessageCard kind="error" message={error.message} hint={error.hint} />
              </View>
            ) : null}
          </View>

          <MessageCard
            kind="info"
            message="Development note"
            hint="If this Firebase project is on the free Spark plan, verification SMS is blocked and real numbers will fail with a billing error. Firebase predefined test numbers still verify genuinely — no SMS is delivered and the console-defined code is used instead."
          />

          <Text style={styles.footer}>Firebase Phone Authentication · project “safeskip-a2”</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <CountryPickerModal
        visible={pickerVisible}
        selected={country}
        onSelect={(next) => {
          setCountry(next);
          setError(null);
        }}
        onClose={() => setPickerVisible(false)}
      />
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
    gap: spacing.md,
  },
  hero: {
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
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
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  flag: {
    fontSize: 24,
  },
  countryText: {
    flex: 1,
  },
  countryName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  countryDial: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  chevron: {
    fontSize: 18,
    color: colors.textMuted,
    transform: [{ rotate: '0deg' }],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  dialPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    paddingRight: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    marginRight: spacing.sm,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
    paddingVertical: 12,
    letterSpacing: 0.5,
  },
  helper: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  buttonWrap: {
    marginTop: spacing.xs,
  },
  messageWrap: {
    marginTop: spacing.xs,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
