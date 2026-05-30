import React, { useEffect, useMemo, useState } from 'react';
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
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radii, spacing, typography } from '../theme';
import {
  DEFAULT_SLOTS,
  type Profile,
  type WhyTag,
  type WorkSituation,
} from '../personalization';

// Best-effort city default from the device's IANA time zone. Hermes/JSC ship
// Intl.DateTimeFormat, so resolvedOptions().timeZone returns something like
// "Asia/Ho_Chi_Minh" — we strip the region prefix and humanize underscores.
// Empty fallback if Intl is unavailable; the field stays editable either way.
function defaultCityFromLocale(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz || typeof tz !== 'string') return '';
    const tail = tz.split('/').slice(1).join(', ');
    if (!tail) return '';
    return tail.replace(/_/g, ' ');
  } catch {
    return '';
  }
}

const WORK_OPTIONS: ReadonlyArray<{ id: WorkSituation; label: string; blurb: string }> = [
  { id: 'student', label: 'Studying', blurb: 'In school, training, learning the trade.' },
  { id: 'working', label: 'Working a job', blurb: 'A paycheck, a role, a manager somewhere above.' },
  { id: 'building', label: 'Building something', blurb: 'Founder, freelance, making your own thing.' },
  { id: 'between', label: 'In between', blurb: 'Pausing, looking, figuring out what next.' },
];

const WHY_OPTIONS: ReadonlyArray<{ id: WhyTag; label: string; blurb: string }> = [
  { id: 'people', label: 'More time with people I love', blurb: 'Buy back the ordinary hours.' },
  { id: 'build', label: 'Build something of my own', blurb: 'A thing that outlasts the paycheck.' },
  { id: 'security', label: 'Stop worrying', blurb: 'Loosen the knot in your chest.' },
  { id: 'world', label: 'See the world', blurb: 'Stay able to go.' },
  { id: 'breathe', label: 'Just breathe', blurb: 'Room. Slow. Yours.' },
  { id: 'unset', label: 'Something else', blurb: "Don't pin it down yet." },
];

type Props = {
  onDone: (profile: Profile) => void;
};

// Five-question onboarding (spec §5). All fields skippable; a blank text
// field or no selection falls through to DEFAULT_SLOTS / 'unset' tags so the
// resulting profile is always grammatical and the engine never sees a partial
// shape. Single-column scrollable form rather than a per-question wizard:
// fewer taps to skip past, easier to revisit answers before committing.
export function OnboardingScreen({ onDone }: Props) {
  const [name, setName] = useState('');
  const [city, setCity] = useState(() => defaultCityFromLocale());
  const [field, setField] = useState('');
  const [work, setWork] = useState<WorkSituation | null>(null);
  const [why, setWhy] = useState<WhyTag | null>(null);

  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withDelay(
      80,
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) }),
    );
  }, [enter]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 14 }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 22 }],
  }));

  const handleBegin = () => {
    // Blank / unset → DEFAULT_SLOTS values + 'unset' tags. Trim everywhere so
    // a stray space doesn't bypass the default fallback.
    const profile: Profile = {
      name: name.trim() || DEFAULT_SLOTS.name,
      city: city.trim() || DEFAULT_SLOTS.city,
      field: field.trim() || DEFAULT_SLOTS.field,
      firm: DEFAULT_SLOTS.firm,
      why: why ?? 'unset',
      workSituation: work ?? 'unset',
    };
    onDone(profile);
  };

  const beginLabel = useMemo(() => {
    const anyTouched =
      name.trim().length > 0 ||
      city.trim().length > 0 ||
      field.trim().length > 0 ||
      work !== null ||
      why !== null;
    return anyTouched ? 'Continue' : 'Skip for now';
  }, [name, city, field, work, why]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.eyebrow}>BEFORE YOU BEGIN</Text>
          <Text style={styles.title}>A few quiet{'\n'}questions.</Text>
          <Text style={styles.lede}>
            Nothing here changes the math. The game just reads you back to
            yourself in the moments that matter. Skip anything you'd rather
            not name.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.body, bodyStyle]}>
          <TextField
            eyebrow="YOUR NAME"
            placeholder="What should the game call you?"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <TextField
            eyebrow="WHERE YOU LIVE"
            placeholder="City, region"
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
          />

          <SelectField
            eyebrow="RIGHT NOW, YOU'RE…"
            options={WORK_OPTIONS}
            value={work}
            onSelect={setWork}
          />

          <TextField
            eyebrow="YOUR FIELD"
            placeholder="What kind of work, broadly?"
            value={field}
            onChangeText={setField}
            autoCapitalize="words"
          />

          <SelectField
            eyebrow="WHAT'S FREEDOM FOR?"
            options={WHY_OPTIONS}
            value={why}
            onSelect={setWhy}
          />
        </Animated.View>
      </ScrollView>

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(8, 9, 11, 0)', colors.bg]}
        style={styles.scrollFade}
      />

      <View style={styles.cta}>
        <PrimaryButton label={beginLabel} onPress={handleBegin} />
      </View>
    </KeyboardAvoidingView>
  );
}

function TextField(props: {
  eyebrow: string;
  placeholder: string;
  value: string;
  onChangeText: (s: string) => void;
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldEyebrow}>{props.eyebrow}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textFaint}
        autoCapitalize={props.autoCapitalize ?? 'sentences'}
        autoCorrect={false}
        returnKeyType="done"
        maxLength={64}
      />
    </View>
  );
}

function SelectField<T extends string>(props: {
  eyebrow: string;
  options: ReadonlyArray<{ id: T; label: string; blurb: string }>;
  value: T | null;
  onSelect: (id: T | null) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldEyebrow}>{props.eyebrow}</Text>
      <View style={styles.optionStack}>
        {props.options.map((opt) => {
          const selected = props.value === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => props.onSelect(selected ? null : opt.id)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <Text
                style={[
                  styles.optionLabel,
                  selected && styles.optionLabelSelected,
                ]}
              >
                {opt.label}
              </Text>
              <Text style={styles.optionBlurb}>{opt.blurb}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 96,
    paddingHorizontal: spacing.xl,
    paddingBottom: 140,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  title: {
    ...typography.hero,
    color: colors.textPrimary,
    fontSize: 32,
    lineHeight: 36,
    marginTop: spacing.xs,
  },
  lede: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 360,
    marginTop: 2,
  },
  body: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  fieldEyebrow: {
    ...typography.eyebrow,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 2.4,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  optionStack: {
    gap: spacing.sm,
  },
  option: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: 2,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  optionLabelSelected: {
    color: colors.accentBright,
  },
  optionBlurb: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  cta: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg,
  },
  scrollFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 88,
    height: 48,
  },
});
