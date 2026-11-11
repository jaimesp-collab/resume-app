import { ReactNode, Ref } from 'react';
import {
  KeyboardAvoidingView,
  Switch,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputInstance,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, TAP_HEIGHT } from '@/lib/theme';

/** Full-screen layout: scrollable content with a fixed button bar at the bottom. */
export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/*
        The app draws edge to edge on Android, so the window no longer shrinks for the
        keyboard there either: pad by the keyboard height on both platforms.
      */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'web' ? undefined : 'padding'}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        pressed && (primary ? styles.buttonPrimaryPressed : styles.buttonSecondaryPressed),
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text style={[styles.buttonLabel, primary ? styles.buttonLabelPrimary : styles.buttonLabelSecondary]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Back + Next side by side, like the design. */
export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={styles.buttonRow}>{children}</View>;
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}
    >
      <Text style={styles.linkLabel}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
    >
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

type FieldProps = TextInputProps & { label?: string; multiline?: boolean; ref?: Ref<TextInputInstance> };

export function Field({ label, multiline, style, ref, ...rest }: FieldProps) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textSubtle}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.inputMultiline, style]}
        accessibilityLabel={label}
        {...rest}
      />
    </View>
  );
}

/** A big selectable option, used for Yes / No questions. */
export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.choiceSelected,
        pressed && !selected && styles.buttonSecondaryPressed,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

/** A tap-to-toggle pill, used for multi-select answers and level pickers. */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && !selected && styles.buttonSecondaryPressed,
      ]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {selected ? '✓ ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}

/** A full-width row with a label and an on/off switch; the whole row is tappable. */
export function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.switchRow}
    >
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.borderStrong }}
        thumbColor="#FFFFFF"
      />
    </Pressable>
  );
}

/** A quiet full-width button such as "+ Add another language". */
export function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.addButton, pressed && styles.buttonSecondaryPressed]}
    >
      <Text style={styles.addLabel}>+ {label}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.screenX, paddingTop: 24, paddingBottom: 24, flexGrow: 1 },
  footer: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },

  button: {
    minHeight: TAP_HEIGHT,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonPrimaryPressed: { backgroundColor: colors.primaryPressed },
  buttonSecondary: { backgroundColor: colors.background, borderWidth: 2, borderColor: colors.border },
  buttonSecondaryPressed: { backgroundColor: colors.surface },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: { fontSize: 18, fontWeight: '600' },
  buttonLabelPrimary: { color: '#FFFFFF' },
  buttonLabelSecondary: { color: colors.text },
  buttonRow: { flexDirection: 'row', gap: 12 },

  link: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' },
  linkLabel: { color: colors.primary, fontSize: 17, fontWeight: '600' },

  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },

  field: { marginBottom: 18 },
  fieldLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: {
    minHeight: TAP_HEIGHT,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: colors.text,
  },
  inputMultiline: { minHeight: 180, lineHeight: 26 },

  choice: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: 12,
  },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primarySofter },
  choiceLabel: { fontSize: 19, fontWeight: '600', color: colors.text },
  choiceLabelSelected: { color: colors.primary },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },

  chip: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySofter },
  chipLabel: { fontSize: 17, fontWeight: '600', color: colors.text },
  chipLabelSelected: { color: colors.primary },

  switchRow: {
    minHeight: TAP_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  switchLabel: { fontSize: 17, fontWeight: '600', color: colors.text, flex: 1 },

  addButton: {
    minHeight: TAP_HEIGHT,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: { fontSize: 17, fontWeight: '600', color: colors.primary },
});
