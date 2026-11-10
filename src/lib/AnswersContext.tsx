import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { Answers, emptyAnswers, normalizeAnswers } from './answers';

const STORAGE_KEY = 'talk-to-resume/answers/v1';

type Ctx = {
  answers: Answers;
  loaded: boolean;
  update: (fn: (a: Answers) => Answers) => void;
  reset: () => void;
};

const AnswersContext = createContext<Ctx | null>(null);

export function AnswersProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [loaded, setLoaded] = useState(false);

  // Load saved answers once.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (!cancelled && json) setAnswers(normalizeAnswers(JSON.parse(json)));
      })
      .catch(() => {
        // Corrupt or unreadable data: start fresh rather than crash.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Save on every change, after the first load (so we never overwrite saved
  // data with the empty defaults).
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(answers)).catch(() => {});
  }, [answers, loaded]);

  const update = useCallback((fn: (a: Answers) => Answers) => setAnswers(fn), []);
  const reset = useCallback(() => setAnswers(emptyAnswers()), []);

  return (
    <AnswersContext.Provider value={{ answers, loaded, update, reset }}>
      {children}
    </AnswersContext.Provider>
  );
}

export function useAnswers(): Ctx {
  const ctx = useContext(AnswersContext);
  if (!ctx) throw new Error('useAnswers must be used inside AnswersProvider');
  return ctx;
}
