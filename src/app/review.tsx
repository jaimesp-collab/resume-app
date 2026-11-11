import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewInstance,
} from 'react-native';

import { ResumeFrame } from '@/components/resume/ResumeFrame';
import type { FrameLayout } from '@/components/resume/frameTypes';
import { Button, Screen } from '@/components/ui';
import { ACCENTS, FORMATS, ResumeFormat } from '@/lib/answers';
import { useAnswers } from '@/lib/AnswersContext';
import { copyText, sharePdf, sharePng } from '@/lib/exportResume';
import { buildResume } from '@/lib/resume';
import {
  DEFAULT_FONT,
  FORMAT_LABELS,
  hasSection,
  renderResumeHtml,
  renderResumeText,
  resumeFileBase,
  SectionKey,
} from '@/lib/templates';
import { colors, radius, spacing, TAP_HEIGHT } from '@/lib/theme';

const ACCENT_NAMES: Record<string, string> = {
  '#2563EB': 'Blue',
  '#0D9488': 'Teal',
  '#16A34A': 'Green',
  '#9F1239': 'Burgundy',
  '#374151': 'Charcoal',
};

const THUMB_W = 100;

function notify(title: string, message?: string) {
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

export default function Review() {
  const { answers, update } = useAnswers();
  const { width: screenW } = useWindowDimensions();
  const previewW = Math.min(screenW - spacing.screenX * 2, 640);

  const resume = useMemo(() => buildResume(answers), [answers]);
  const { format, accent } = answers;
  const [layout, setLayout] = useState<FrameLayout | null>(null);
  const [busy, setBusy] = useState<null | 'pdf' | 'png' | 'text'>(null);
  const preview = useRef<ViewInstance>(null);

  const html = useMemo(
    () => renderResumeHtml(resume, { format, accent, fontSize: DEFAULT_FONT, mode: 'screen' }),
    [resume, format, accent],
  );
  const thumbs = useMemo(
    () =>
      FORMATS.map((f) => ({
        format: f,
        html: renderResumeHtml(resume, { format: f, accent, fontSize: DEFAULT_FONT, mode: 'screen' }),
      })),
    [resume, accent],
  );

  const onLayoutInfo = useCallback((info: FrameLayout) => setLayout(info), []);

  const choose = (f: ResumeFormat) => {
    setLayout(null);
    update((a) => ({ ...a, format: f }));
  };
  const chooseAccent = (c: string) => update((a) => ({ ...a, accent: c }));

  const editStep = (id: string) => {
    update((a) => ({ ...a, currentStepId: id }));
    router.navigate('/questions');
  };

  const fileBase = resumeFileBase(resume.name);
  const run = async (kind: 'pdf' | 'png' | 'text', job: () => Promise<void>, done?: string) => {
    setBusy(kind);
    try {
      await job();
      if (done) notify(done);
    } catch (e) {
      notify("Couldn't do that", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const fontSize = layout?.fontSize ?? DEFAULT_FONT;
  const pageNote = !layout
    ? ' '
    : layout.pages === 1
      ? 'Fits on one page'
      : `Runs onto ${layout.pages} pages even with smaller text. Shorter answers will make it fit.`;

  const sectionRows: { key: SectionKey | 'header'; label: string; step: string; filled: boolean }[] = [
    { key: 'header', label: 'Name & contact', step: 'contact', filled: !!resume.name },
    { key: 'summary', label: 'Summary', step: 'bestAt', filled: hasSection(resume, 'summary') },
    {
      key: 'experience',
      label: 'Experience',
      step: answers.hasJob === 'yes' ? 'job1:info' : 'hasJob',
      filled: hasSection(resume, 'experience'),
    },
    { key: 'education', label: 'Education', step: 'education', filled: hasSection(resume, 'education') },
    { key: 'skills', label: 'Skills', step: 'skills', filled: hasSection(resume, 'skills') },
    {
      key: 'certificates',
      label: 'Certifications & Awards',
      step: 'certificates',
      filled: hasSection(resume, 'certificates'),
    },
    { key: 'languages', label: 'Languages', step: 'languages', filled: hasSection(resume, 'languages') },
    { key: 'other', label: 'Volunteering & Projects', step: 'extra', filled: hasSection(resume, 'other') },
    { key: 'availability', label: 'Availability', step: 'availability', filled: hasSection(resume, 'availability') },
  ];

  return (
    <Screen
      footer={<Button label="Done" onPress={() => router.dismissTo('/')} />}
    >
      <View style={s.titleRow}>
        <Text style={s.title}>Your resume</Text>
        <Text style={s.ready}>Saved</Text>
      </View>

      {/* Format picker */}
      <Text style={s.label}>Format</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.thumbScroller}
        contentContainerStyle={s.thumbRow}
      >
        {thumbs.map((t) => {
          const selected = t.format === format;
          const recommended = t.format === 'skillsFirst' && answers.hasJob === 'no';
          return (
            <Pressable
              key={t.format}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${FORMAT_LABELS[t.format]} format${recommended ? ', recommended for you' : ''}`}
              onPress={() => choose(t.format)}
              style={[s.thumbCard, selected && s.thumbCardSelected]}
            >
              <View style={s.thumbFrame}>
                <ResumeFrame html={t.html} width={THUMB_W} firstPageOnly />
              </View>
              <Text style={[s.thumbLabel, selected && s.thumbLabelSelected]}>{FORMAT_LABELS[t.format]}</Text>
              {recommended ? (
                <View style={s.tag}>
                  <Text style={s.tagText}>Recommended for you</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Accent colors */}
      <View style={s.dotsRow}>
        {ACCENTS.map((c) => {
          const selected = accent === c;
          return (
            <Pressable
              key={c}
              accessibilityRole="radio"
              accessibilityLabel={`${ACCENT_NAMES[c]} color`}
              accessibilityState={{ selected, disabled: format === 'classic' }}
              disabled={format === 'classic'}
              onPress={() => chooseAccent(c)}
              style={s.dotHit}
            >
              <View
                style={[
                  s.dot,
                  { backgroundColor: c },
                  selected && s.dotSelected,
                  format === 'classic' && { opacity: 0.3 },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <Text style={s.hint}>{format === 'classic' ? 'Classic is always black and white.' : ' '}</Text>

      {/* Live preview */}
      <View style={[s.previewShadow, { width: previewW + 2 }]}>
        <ResumeFrame key={format} html={html} width={previewW} onLayoutInfo={onLayoutInfo} captureRef={preview} />
      </View>
      <Text style={[s.hint, layout && layout.pages > 1 && { color: colors.danger }]}>{pageNote}</Text>

      {/* Save & share */}
      <Text style={[s.label, { marginTop: 28 }]}>Save & share</Text>
      <View style={{ gap: 12 }}>
        <Button
          label={busy === 'pdf' ? 'Making PDF…' : 'Share as PDF'}
          disabled={!!busy}
          onPress={() => run('pdf', () => sharePdf(resume, { format, accent, fontSize }, fileBase))}
        />
        <Button
          label={busy === 'png' ? 'Making image…' : 'Share as image (PNG)'}
          variant="secondary"
          disabled={!!busy}
          onPress={() => run('png', () => sharePng(preview, fileBase))}
        />
        <Button
          label="Copy as text"
          variant="secondary"
          disabled={!!busy}
          onPress={() =>
            run('text', () => copyText(renderResumeText(resume)), 'Copied. Paste it into the job form.')
          }
        />
      </View>

      {/* Edit */}
      <Text style={[s.label, { marginTop: 28 }]}>Edit a section</Text>
      <View style={s.editList}>
        {sectionRows.map((row, i) => (
          <Pressable
            key={row.key}
            accessibilityRole="button"
            accessibilityLabel={`${row.filled ? 'Edit' : 'Add'} ${row.label}`}
            onPress={() => (row.step === 'contact' ? router.navigate('/contact') : editStep(row.step))}
            style={({ pressed }) => [s.editRow, i > 0 && s.editRowBorder, pressed && { backgroundColor: colors.surface }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.editLabel}>{row.label}</Text>
              {!row.filled ? <Text style={s.editEmpty}>Not on your resume yet</Text> : null}
            </View>
            <Text style={s.editAction}>{row.filled ? 'Edit' : 'Add'}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '700', color: colors.text },
  ready: { fontSize: 17, fontWeight: '600', color: colors.success },
  label: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 20, marginBottom: 12 },
  hint: { fontSize: 15, color: colors.textMuted, marginTop: 8, minHeight: 20 },

  thumbScroller: { marginHorizontal: -spacing.screenX },
  thumbRow: { paddingHorizontal: spacing.screenX, gap: 12 },
  thumbCard: {
    width: THUMB_W + 16,
    padding: 6,
    paddingBottom: 10,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  thumbCardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySofter },
  thumbFrame: { borderWidth: 1, borderColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  thumbLabel: { marginTop: 8, fontSize: 15, fontWeight: '600', color: colors.text },
  thumbLabelSelected: { color: colors.primary },
  tag: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: '#DCFCE7',
  },
  tagText: { fontSize: 11, fontWeight: '700', color: '#166534', textAlign: 'center' },

  dotsRow: { flexDirection: 'row', gap: 4, marginTop: 14 },
  dotHit: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 32, height: 32, borderRadius: 16 },
  dotSelected: { borderWidth: 3, borderColor: '#FFFFFF', outlineWidth: 2, outlineColor: colors.text, outlineStyle: 'solid' },

  previewShadow: {
    alignSelf: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  editList: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' },
  editRow: { minHeight: TAP_HEIGHT + 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  editRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  editLabel: { fontSize: 17, fontWeight: '600', color: colors.text },
  editEmpty: { fontSize: 14, color: colors.textSubtle, marginTop: 2 },
  editAction: { fontSize: 17, fontWeight: '600', color: colors.primary },
});
