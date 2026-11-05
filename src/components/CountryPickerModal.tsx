import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { COUNTRIES, type Country } from '../lib/countries';
import { colors, spacing } from '../theme';

type Props = {
  visible: boolean;
  selected: Country;
  onSelect: (country: Country) => void;
  onClose: () => void;
};

export function CountryPickerModal({ visible, selected, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? COUNTRIES.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          `+${c.dial}`.includes(q.replace(/\s/g, ''))
        );
      })
    : COUNTRIES;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Select country</Text>
            <Pressable onPress={onClose} accessibilityRole="button" style={styles.close}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search country or dial code"
            placeholderTextColor={colors.textMuted}
            style={styles.search}
            autoCorrect={false}
          />

          <FlatList
            data={filtered}
            keyExtractor={(item, index) => `${item.code}-${item.dial}-${index}`}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            renderItem={({ item }) => {
              const active = item.code === selected.code && item.dial === selected.dial;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && styles.rowPressed]}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.dial}>+{item.dial}</Text>
                  {active ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={<Text style={styles.empty}>No matching country.</Text>}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  closeText: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '700',
  },
  search: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 13,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
  rowActive: {
    backgroundColor: colors.primarySoft,
  },
  rowPressed: {
    backgroundColor: colors.bg,
  },
  flag: {
    fontSize: 20,
    width: 28,
  },
  name: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  dial: {
    fontSize: 15,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  check: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    padding: spacing.lg,
  },
});
