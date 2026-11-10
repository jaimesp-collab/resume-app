import { router } from 'expo-router';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { Button, Screen } from '@/components/ui';
import { useAnswers } from '@/lib/AnswersContext';
import { colors, radius } from '@/lib/theme';

const STEPS = [
  { n: '1', title: 'Your contact details', body: 'Name, city, phone and email.' },
  { n: '2', title: 'Answer 11 short questions', body: 'Talk or type. Skip any you like.' },
  { n: '3', title: 'See your resume', body: 'We turn your answers into a clean draft.' },
];

export default function Welcome() {
  const { answers, update, reset } = useAnswers();
  const hasProgress = answers.started;

  const begin = () => {
    update((a) => ({ ...a, started: true }));
    router.push('/contact');
  };

  const resume = () => {
    router.push(answers.contact.fullName.trim() ? '/questions' : '/contact');
  };

  const startOver = () => {
    const doReset = () => {
      reset();
      update((a) => ({ ...a, started: true }));
      router.push('/contact');
    };
    if (Platform.OS === 'web') {
      // Alert buttons are not supported on web.
      if (globalThis.confirm?.('Start over? This clears all your answers.')) doReset();
      return;
    }
    Alert.alert('Start over?', 'This clears all your answers on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start over', style: 'destructive', onPress: doReset },
    ]);
  };

  return (
    <Screen
      footer={
        hasProgress ? (
          <View style={{ gap: 12 }}>
            <Button label="Continue where I left off" onPress={resume} />
            <Button label="Start over" variant="secondary" onPress={startOver} />
          </View>
        ) : (
          <Button label="Get started" onPress={begin} />
        )
      }
    >
      <View style={s.badge}>
        <Text style={s.badgeIcon}>🎙️</Text>
      </View>
      <Text style={s.title}>Talk-to-resume</Text>
      <Text style={s.subtitle}>
        Answer a few questions, just like talking to a friend. We'll write your resume.
      </Text>

      <View style={s.steps}>
        {STEPS.map((step) => (
          <View key={step.n} style={s.step}>
            <View style={s.stepNum}>
              <Text style={s.stepNumText}>{step.n}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.stepTitle}>{step.title}</Text>
              <Text style={s.stepBody}>{step.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={s.note}>Your answers are saved only on this phone.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  badgeIcon: { fontSize: 40 },
  title: { fontSize: 34, fontWeight: '700', color: colors.text, marginBottom: 12 },
  subtitle: { fontSize: 19, lineHeight: 28, color: colors.textMuted, marginBottom: 32 },
  steps: { gap: 14 },
  step: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  stepNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  stepTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 2 },
  stepBody: { fontSize: 16, lineHeight: 22, color: colors.textMuted },
  note: { marginTop: 24, fontSize: 15, color: colors.textSubtle, textAlign: 'center' },
});
