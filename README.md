# Talk-to-resume

An Expo (React Native) app that builds a resume from short, spoken or typed answers.

## Flow

1. **Welcome** – shows "Continue where I left off" / "Start over" when answers are already saved.
2. **Contact** – full name, city, phone, email and an optional LinkedIn or website link.
3. **Questions** – one per screen with a progress bar, Back / Next and Skip:
   1. What kind of job are you applying for? *(not printed; used to put matching skills and results first)*
   2. Have you had a job before? *(No or Skip jumps to question 7)*
   3. Most recent job: title, where, city, start and finish, "I still work here" *(title becomes the headline)*
   4. Day to day
   5. Proudest result
   6. Another job to add? *(Yes repeats 3–5 for the next job)*
   7. Volunteering, school projects or side work
   8. School or training *(one or more, each with what you studied and a year or "In progress")*
   9. Tools or skills
   10. Languages, each with a level: Native, Fluent, Conversational, Basic
   11. Certificates, licenses or awards, each with an optional year
   12. When can you work? *(Full time, Part time, Mornings, Evenings, Nights, Weekends; can start right away or on a date)*
   13. What a past boss or teacher would say you're best at *(used for the summary)*
4. **Your resume** – pick a format (Classic, Modern, Skills first, Two column) and an accent color,
   see a live preview, then **Share as PDF**, **Share as image (PNG)** or **Copy as text**.
   Sections with no answers are hidden; each section has an Edit / Add row.

Answers, the chosen format and the color are saved on the device with AsyncStorage.

## Resume formats

Each format in `src/lib/templates.ts` renders the same resume data to one HTML page. The preview,
the thumbnails and the PDF all use that HTML, and the PNG is a snapshot of the preview, so they match.
Pages are US Letter with 0.6 in margins. If the content doesn't fit on one page, the body text steps
down from 11 pt to 9.5 pt before it runs onto a second page.

## Code

- `src/app/` – screens (Expo Router)
- `src/lib/questions.ts` – question text and the branching order
- `src/lib/answers.ts` – the saved data shape
- `src/lib/resume.ts` – turns answers into resume content (headline, summary, ordering)
- `src/lib/templates.ts` – the four resume formats (HTML), plain-text export and file names
- `src/lib/exportResume.ts` – PDF (expo-print), PNG (react-native-view-shot), sharing and copy
- `src/components/resume/ResumeFrame.tsx` – shows a rendered page (WebView; iframe on web)
- `src/components/ui.tsx` – buttons, fields, progress bar (56pt minimum tap height)

## Run

```bash
npm install
npx expo start      # then open in Expo Go, or press w for web
npm run typecheck
```
