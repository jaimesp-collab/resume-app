# Talk-to-resume

An Expo (React Native) app that builds a resume from short, spoken or typed answers.

## Flow

1. **Welcome** – shows "Continue where I left off" / "Start over" when answers are already saved.
2. **Contact** – full name, city, phone, email (phone and email keyboards, autofill hints).
3. **Questions** – one per screen with a progress bar, Back / Next and Skip:
   1. What kind of job are you applying for? *(not printed; used to put matching skills and results first)*
   2. Have you had a job before? *(No or Skip jumps to question 7)*
   3. Most recent job title, where, start and finish *(title becomes the headline under the name)*
   4. Day to day
   5. Proudest result
   6. Another job to add? *(Yes repeats 3–5 for the next job)*
   7. Volunteering, school projects or side work
   8. School or training
   9. Tools, skills or languages
   10. Certificates or licenses
   11. What a past boss or teacher would say you're best at *(used for the summary)*
4. **Your resume** – a draft built from the answers, with Edit links per section.

Answers are saved on the device with AsyncStorage after every change.

## Code

- `src/app/` – screens (Expo Router)
- `src/lib/questions.ts` – question text and the branching order
- `src/lib/answers.ts` – the saved data shape
- `src/lib/resume.ts` – turns answers into resume content (headline, summary, ordering)
- `src/components/ui.tsx` – buttons, fields, progress bar (56pt minimum tap height)

## Run

```bash
npm install
npx expo start      # then open in Expo Go, or press w for web
npm run typecheck
```
