import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

type Kind = 'error' | 'success' | 'info';

type Props = {
  kind: Kind;
  message: string;
  hint?: string;
};

const palette: Record<Kind, { bg: string; border: string; title: string; icon: string }> = {
  error: { bg: colors.errorSoft, border: '#FECACA', title: colors.error, icon: '!' },
  success: { bg: colors.successSoft, border: '#BBF7D0', title: colors.success, icon: '✓' },
  info: { bg: colors.infoSoft, border: '#BAE6FD', title: colors.info, icon: 'i' },
};

export function MessageCard({ kind, message, hint }: Props) {
  const p = palette[kind];
  return (
    <View style={[styles.card, { backgroundColor: p.bg, borderColor: p.border }]}>
      <View style={[styles.iconBubble, { backgroundColor: p.title }]}>
        <Text style={styles.iconText}>{p.icon}</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.message, { color: p.title }]}>{message}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
  },
  iconBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 15,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
});
