import { router } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, Text, TextInputInstance } from 'react-native';

import { Button, ButtonRow, Field, Screen } from '@/components/ui';
import { Contact } from '@/lib/answers';
import { useAnswers } from '@/lib/AnswersContext';
import { colors } from '@/lib/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactScreen() {
  const { answers, update } = useAnswers();
  const c = answers.contact;
  const cityRef = useRef<TextInputInstance>(null);
  const phoneRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);

  const set = (patch: Partial<Contact>) =>
    update((a) => ({ ...a, started: true, contact: { ...a.contact, ...patch } }));

  const email = c.email.trim();
  const emailInvalid = email.length > 0 && !EMAIL_RE.test(email);
  const canContinue = c.fullName.trim().length > 0 && !emailInvalid;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const next = () => router.push('/questions');

  return (
    <Screen
      footer={
        <ButtonRow>
          <Button label="Back" variant="secondary" onPress={back} style={{ flex: 1 }} />
          <Button label="Next" onPress={next} disabled={!canContinue} style={{ flex: 1 }} />
        </ButtonRow>
      }
    >
      <Text style={s.title}>How can employers reach you?</Text>
      <Text style={s.subtitle}>This goes at the top of your resume.</Text>

      <Field
        label="Full name"
        value={c.fullName}
        onChangeText={(fullName) => set({ fullName })}
        placeholder="Alex Rivera"
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => cityRef.current?.focus()}
      />
      <Field
        ref={cityRef}
        label="City"
        value={c.city}
        onChangeText={(city) => set({ city })}
        placeholder="Chicago, IL"
        textContentType="addressCityAndState"
        autoCapitalize="words"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />
      <Field
        ref={phoneRef}
        label="Phone"
        value={c.phone}
        onChangeText={(phone) => set({ phone })}
        placeholder="(555) 010-2030"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <Field
        ref={emailRef}
        label="Email"
        value={c.email}
        onChangeText={(v) => set({ email: v })}
        placeholder="alex@email.com"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={() => canContinue && next()}
      />
      {emailInvalid ? <Text style={s.error}>Check your email address. It should look like name@email.com</Text> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 17, color: colors.textMuted, marginBottom: 28 },
  error: { fontSize: 15, color: colors.danger, marginTop: -8 },
});
