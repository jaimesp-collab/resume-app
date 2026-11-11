import { router, useFocusEffect } from 'expo-router';
import { ReactNode, useCallback } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';

import { AddButton, Button, ButtonRow, Chip, Choice, Field, ProgressBar, Screen, SwitchRow, TextLink } from '@/components/ui';
import { Answers, LANGUAGE_LEVELS, WORK_TIMES, WorkTime, YesNo } from '@/lib/answers';
import { useAnswers } from '@/lib/AnswersContext';
import {
  addItem,
  buildSteps,
  isAnswered,
  removeItem,
  setAvailability,
  setItem,
  setAnotherJob,
  setHasJob,
  setJob,
  setText,
  Step,
  TOTAL_QUESTIONS,
} from '@/lib/questions';
import { colors, radius, TAP_HEIGHT } from '@/lib/theme';

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
          <Field
            label="City (optional)"
            value={job?.city ?? ''}
            onChangeText={(city) => set({ city })}
            placeholder="Chicago, IL"
            autoCapitalize="words"
          />
          <SwitchRow label="I still work here" value={!!job?.current} onChange={(current) => set({ current })} />
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
              {job?.current ? (
                <View style={s.present}>
                  <Text style={s.presentLabel}>Finished</Text>
                  <Text style={s.presentValue}>Present</Text>
                </View>
              ) : (
                <Field
                  label="Finished"
                  value={job?.end ?? ''}
                  onChangeText={(end) => set({ end })}
                  placeholder="2024"
                />
              )}
            </View>
          </View>
        </View>
      );
    }

    case 'education':
      return (
        <View>
          {answers.education.map((e, i) => (
            <ItemCard
              key={i}
              title={answers.education.length > 1 ? `School or training ${i + 1}` : undefined}
              onRemove={answers.education.length > 1 ? () => update((a) => removeItem(a, 'education', i)) : undefined}
            >
              <Field
                label="School or training"
                value={e.school}
                onChangeText={(school) => update((a) => setItem(a, 'education', i, { school }))}
                placeholder="Lincoln High School"
                autoCapitalize="words"
              />
              <Field
                label="What you studied (optional)"
                value={e.studied}
                onChangeText={(studied) => update((a) => setItem(a, 'education', i, { studied }))}
                placeholder="High school diploma, forklift training…"
              />
              <SwitchRow
                label="Still in progress"
                value={e.inProgress}
                onChange={(inProgress) => update((a) => setItem(a, 'education', i, { inProgress }))}
              />
              {e.inProgress ? null : (
                <Field
                  label="Year finished (optional)"
                  value={e.year}
                  onChangeText={(year) => update((a) => setItem(a, 'education', i, { year }))}
                  placeholder="2019"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              )}
            </ItemCard>
          ))}
          <AddButton label="Add another school or training" onPress={() => update((a) => addItem(a, 'education'))} />
          <MicTip />
        </View>
      );

    case 'languages':
      return (
        <View>
          {answers.languages.map((l, i) => (
            <ItemCard
              key={i}
              onRemove={answers.languages.length > 1 ? () => update((a) => removeItem(a, 'languages', i)) : undefined}
            >
              <Field
                label="Language"
                value={l.name}
                onChangeText={(name) => update((a) => setItem(a, 'languages', i, { name }))}
                placeholder={i === 0 ? 'Spanish' : 'English'}
                autoCapitalize="words"
              />
              <Text style={s.groupLabel}>How well?</Text>
              <View style={s.chips} accessibilityRole="radiogroup">
                {LANGUAGE_LEVELS.map((level) => (
                  <Chip
                    key={level}
                    label={level}
                    selected={l.level === level}
                    onPress={() =>
                      update((a) => setItem(a, 'languages', i, { level: l.level === level ? null : level }))
                    }
                  />
                ))}
              </View>
            </ItemCard>
          ))}
          <AddButton label="Add another language" onPress={() => update((a) => addItem(a, 'languages'))} />
          <MicTip />
        </View>
      );

    case 'certificates':
      return (
        <View>
          {answers.certificates.map((c, i) => (
            <ItemCard
              key={i}
              onRemove={
                answers.certificates.length > 1 ? () => update((a) => removeItem(a, 'certificates', i)) : undefined
              }
            >
              <Field
                label="Certificate, license or award"
                value={c.name}
                onChangeText={(name) => update((a) => setItem(a, 'certificates', i, { name }))}
                placeholder="Food handler card"
              />
              <Field
                label="Year (optional)"
                value={c.year}
                onChangeText={(year) => update((a) => setItem(a, 'certificates', i, { year }))}
                placeholder="2023"
                keyboardType="number-pad"
                maxLength={4}
              />
            </ItemCard>
          ))}
          <AddButton label="Add another" onPress={() => update((a) => addItem(a, 'certificates'))} />
          <MicTip />
        </View>
      );

    case 'availability': {
      const av = answers.availability;
      const toggle = (t: WorkTime) =>
        update((a) => {
          const times = a.availability.times.includes(t)
            ? a.availability.times.filter((x) => x !== t)
            : WORK_TIMES.filter((x) => x === t || a.availability.times.includes(x));
          return setAvailability(a, { times });
        });
      return (
        <View>
          <View style={s.chips}>
            {WORK_TIMES.map((t) => (
              <Chip key={t} label={t} selected={av.times.includes(t)} onPress={() => toggle(t)} />
            ))}
          </View>
          <Text style={[s.groupLabel, { marginTop: 24 }]}>When can you start? (optional)</Text>
          <View style={[s.chips, { marginBottom: 14 }]}>
            <Chip
              label="Right away"
              selected={av.rightAway}
              onPress={() => update((a) => setAvailability(a, { rightAway: !a.availability.rightAway }))}
            />
          </View>
          {av.rightAway ? null : (
            <Field
              label="Or pick a date"
              value={av.startDate}
              onChangeText={(startDate) => update((a) => setAvailability(a, { startDate }))}
              placeholder="June 1"
            />
          )}
          <MicTip />
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

function MicTip() {
  return (
    <View style={[s.tip, { marginTop: 18 }]}>
      <Text style={s.tipIcon}>🎤</Text>
      <Text style={s.tipText}>Rather talk? Tap the mic on your keyboard and say your answer.</Text>
    </View>
  );
}

/** One entry in a list answer (a school, a language, a certificate). */
function ItemCard({ title, onRemove, children }: { title?: string; onRemove?: () => void; children: ReactNode }) {
  return (
    <View style={s.card}>
      {title || onRemove ? (
        <View style={s.cardHead}>
          <Text style={s.cardTitle}>{title ?? ''}</Text>
          {onRemove ? <TextLink label="Remove" onPress={onRemove} /> : null}
        </View>
      ) : null}
      {children}
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
  present: { marginBottom: 18 },
  presentLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  presentValue: {
    minHeight: TAP_HEIGHT,
    lineHeight: TAP_HEIGHT,
    fontSize: 18,
    color: colors.textMuted,
    paddingHorizontal: 16,
  },
  groupLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    paddingBottom: 0,
    marginBottom: 14,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -8 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
});
