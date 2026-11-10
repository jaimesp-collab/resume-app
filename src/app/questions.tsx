import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';

import { Button, ButtonRow, Choice, Field, ProgressBar, Screen, TextLink } from '@/components/ui';
import { Answers, YesNo } from '@/lib/answers';
import { useAnswers } from '@/lib/AnswersContext';
import {
  buildSteps,
  isAnswered,
  setAnotherJob,
  setHasJob,
  setJob,
  setText,
  Step,
  TOTAL_QUESTIONS,
} from '@/lib/questions';
import { colors } from '@/lib/theme';

export default function Questions() {
  const { answers, update } = useAnswers();
  const steps = buildSteps(answers);
  const found = steps.findIndex((s) => s.id === answers.currentStepId);
  const index = found === -1 ? 0 : found;
  const step = steps[index];

  /** Move forward or back from the current step, using the given answers to work out the path. */
  const go = useCallback(
    (base: Answers, delta: 1 | -1) => {
      const path = buildSteps(base);
      const i = Math.max(0, path.findIndex((s) => s.id === step.id));
      const target = path[i + delta];
      if (target) {
        update(() => ({ ...base, currentStepId: target.id }));
      } else if (delta === 1) {
        update(() => ({ ...base, currentStepId: step.id }));
        router.push('/review');
      } else {
        router.navigate('/contact');
      }
    },
    [step.id, update],
  );

  // Android hardware back goes to the previous question, not out of the flow.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        go(answers, -1);
        return true;
      });
      return () => sub.remove();
    }, [go, answers]),
  );

  const answered = isAnswered(answers, step);
  const last = index === steps.length - 1;

  return (
    <Screen
      footer={
        <ButtonRow>
          <Button label="Back" variant="secondary" onPress={() => go(answers, -1)} style={{ flex: 1 }} />
          <Button
            label={last ? 'Finish' : 'Next'}
            onPress={() => go(answers, 1)}
            disabled={!answered}
            style={{ flex: 1 }}
          />
        </ButtonRow>
      }
    >
      <View style={s.topRow}>
        <Text style={s.counter}>
          Question {step.number} of {TOTAL_QUESTIONS}
        </Text>
        <TextLink label="Skip" onPress={() => go(answers, 1)} />
      </View>
      <ProgressBar value={step.number / TOTAL_QUESTIONS} />

      <Text style={s.prompt} accessibilityRole="header">
        {step.prompt}
      </Text>
      {step.hint ? <Text style={s.hint}>{step.hint}</Text> : null}

      <View style={s.body}>
        <StepInput key={step.id} step={step} answers={answers} update={update} />
      </View>
    </Screen>
  );
}

type InputProps = {
  step: Step;
  answers: Answers;
  update: (fn: (a: Answers) => Answers) => void;
};

function StepInput({ step, answers, update }: InputProps) {
  switch (step.kind) {
    case 'text':
      return (
        <AnswerBox
          value={answers[step.field]}
          placeholder={step.placeholder}
          label={step.prompt}
          onChange={(v) => update((a) => setText(a, step.field, v))}
        />
      );

    case 'jobText':
      return (
        <AnswerBox
          value={answers.jobs[step.job]?.[step.field] ?? ''}
          placeholder={step.placeholder}
          label={step.prompt}
          onChange={(v) => update((a) => setJob(a, step.job, { [step.field]: v }))}
        />
      );

    case 'jobInfo': {
      const job = answers.jobs[step.job];
      const set = (patch: Parameters<typeof setJob>[2]) => update((a) => setJob(a, step.job, patch));
      return (
        <View>
          <Field
            label="Job title"
            value={job?.title ?? ''}
            onChangeText={(title) => set({ title })}
            placeholder="Shift Lead"
            autoCapitalize="words"
          />
          <Field
            label="Where"
            value={job?.employer ?? ''}
            onChangeText={(employer) => set({ employer })}
            placeholder="Northside Warehouse"
            autoCapitalize="words"
          />
          <View style={s.dates}>
            <View style={{ flex: 1 }}>
              <Field
                label="Started"
                value={job?.start ?? ''}
                onChangeText={(start) => set({ start })}
                placeholder="2021"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Finished"
                value={job?.end ?? ''}
                onChangeText={(end) => set({ end })}
                placeholder="now"
              />
            </View>
          </View>
        </View>
      );
    }

    case 'hasJob':
      return (
        <YesNoChoices value={answers.hasJob} onChange={(v) => update((a) => setHasJob(a, v))} />
      );

    case 'anotherJob':
      return (
        <YesNoChoices
          value={answers.jobs[step.job]?.addAnother ?? null}
          onChange={(v) => update((a) => setAnotherJob(a, step.job, v))}
        />
      );
  }
}

function AnswerBox(props: { value: string; placeholder: string; label: string; onChange: (v: string) => void }) {
  return (
    <View>
      <Field
        multiline
        value={props.value}
        onChangeText={props.onChange}
        placeholder={props.placeholder}
        accessibilityLabel={props.label}
        autoCapitalize="sentences"
      />
      <View style={s.tip}>
        <Text style={s.tipIcon}>🎤</Text>
        <Text style={s.tipText}>Rather talk? Tap the mic on your keyboard and say your answer.</Text>
      </View>
    </View>
  );
}

function YesNoChoices({ value, onChange }: { value: YesNo; onChange: (v: YesNo) => void }) {
  return (
    <View accessibilityRole="radiogroup">
      <Choice label="Yes" selected={value === 'yes'} onPress={() => onChange('yes')} />
      <Choice label="No" selected={value === 'no'} onPress={() => onChange('no')} />
    </View>
  );
}

const s = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  counter: { fontSize: 16, color: colors.textMuted },
  prompt: { fontSize: 28, lineHeight: 36, fontWeight: '700', color: colors.text, marginTop: 28 },
  hint: { fontSize: 17, lineHeight: 24, color: colors.textMuted, marginTop: 10 },
  body: { marginTop: 24 },
  dates: { flexDirection: 'row', gap: 12 },
  tip: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tipIcon: { fontSize: 20 },
  tipText: { flex: 1, fontSize: 15, lineHeight: 21, color: colors.textMuted },
});
