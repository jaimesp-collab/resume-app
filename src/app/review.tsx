import { router } from 'expo-router';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, ButtonRow, Screen, TextLink } from '@/components/ui';
import { useAnswers } from '@/lib/AnswersContext';
import { buildResume } from '@/lib/resume';
import { colors, radius } from '@/lib/theme';

export default function Review() {
  const { answers, update } = useAnswers();
  const r = buildResume(answers);

  const editStep = (id: string) => {
    update((a) => ({ ...a, currentStepId: id }));
    router.navigate('/questions');
  };
  const editContact = () => router.navigate('/contact');

  const contactLine = [r.phone, r.email].filter(Boolean).join('  ·  ');
  const headlineLine = [r.headline, r.city].filter(Boolean).join('  ·  ');

  return (
    <Screen
      footer={
        <ButtonRow>
          <Button label="Edit" variant="secondary" onPress={() => editStep('targetJob')} style={{ flex: 1 }} />
          <Button label="Done" onPress={() => router.dismissTo('/')} style={{ flex: 1 }} />
        </ButtonRow>
      }
    >
      <View style={s.titleRow}>
        <Text style={s.title}>Your resume</Text>
        <Text style={s.ready}>Saved</Text>
      </View>
      <Text style={s.subtitle}>Tap Edit next to any part to change it.</Text>

      <View style={s.card}>
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{r.name || 'Your name'}</Text>
            {headlineLine ? <Text style={s.headline}>{headlineLine}</Text> : null}
            {contactLine ? <Text style={s.contact}>{contactLine}</Text> : null}
          </View>
          <TextLink label="Edit" onPress={editContact} />
        </View>

        <Section title="Summary" text={r.summary} onEdit={() => editStep('bestAt')} />

        {r.experience.length > 0 ? (
          <Section title="Experience" onEdit={() => editStep('job1:info')}>
            {r.experience.map((job, i) => (
              <View key={i} style={i > 0 && { marginTop: 14 }}>
                <Text style={s.jobTitle}>{[job.title, job.employer].filter(Boolean).join(', ')}</Text>
                {job.dates ? <Text style={s.muted}>{job.dates}</Text> : null}
                <Bullets items={job.bullets} />
              </View>
            ))}
          </Section>
        ) : null}

        {r.other.length > 0 ? (
          <Section title="Volunteering & projects" onEdit={() => editStep('extra')}>
            <Bullets items={r.other} />
          </Section>
        ) : null}

        {r.skills.length > 0 ? (
          <Section title="Skills" onEdit={() => editStep('skills')}>
            <View style={s.chips}>
              {r.skills.map((skill, i) => (
                <View key={i} style={s.chip}>
                  <Text style={s.chipText}>{skill}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {r.certificates.length > 0 ? (
          <Section title="Certificates & licenses" onEdit={() => editStep('certificates')}>
            <Bullets items={r.certificates} />
          </Section>
        ) : null}

        {r.education.length > 0 ? (
          <Section title="Education" onEdit={() => editStep('education')}>
            {r.education.map((line, i) => (
              <Text key={i} style={s.body}>
                {line}
              </Text>
            ))}
          </Section>
        ) : null}
      </View>
    </Screen>
  );
}

function Section(props: { title: string; text?: string; onEdit: () => void; children?: ReactNode }) {
  if (!props.children && !props.text) return null;
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>{props.title.toUpperCase()}</Text>
        <TextLink label="Edit" onPress={props.onEdit} />
      </View>
      {props.text ? <Text style={s.body}>{props.text}</Text> : props.children}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={{ marginTop: 6, gap: 4 }}>
      {items.map((item, i) => (
        <View key={i} style={s.bulletRow}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={[s.body, { flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '700', color: colors.text },
  ready: { fontSize: 17, fontWeight: '600', color: colors.success },
  subtitle: { fontSize: 16, color: colors.textMuted, marginTop: 6, marginBottom: 20 },
  card: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 20,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: { fontSize: 26, fontWeight: '700', color: colors.text },
  headline: { fontSize: 17, color: colors.textMuted, marginTop: 6 },
  contact: { fontSize: 14, color: colors.textSubtle, marginTop: 6 },
  section: { marginTop: 16 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5, color: colors.primary },
  body: { fontSize: 16, lineHeight: 23, color: colors.textMuted },
  muted: { fontSize: 14, color: colors.textSubtle, marginTop: 2 },
  jobTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletDot: { fontSize: 16, lineHeight: 23, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: {
    backgroundColor: colors.primarySofter,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 15, color: colors.primary, fontWeight: '500' },
});
