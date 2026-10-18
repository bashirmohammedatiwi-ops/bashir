"use client";
import { useEffect, useRef, useState } from "react";

type Rec = { lang: string; interimResults: boolean; maxAlternatives: number; start: () => void; stop: () => void; onresult: ((e: { results: { 0: { transcript: string } }[] & { length: number } }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };

/** البحث بالصوت (Web Speech API) — العربي العراقي أولاً. */
export function useSpeech(onText: (t: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<Rec | null>(null);
  const cb = useRef(onText);
  cb.current = onText;

  useEffect(() => {
    const W = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const C = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!C) return;
    const r = new C();
    r.lang = "ar-IQ";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const t = e.results[e.results.length - 1]?.[0]?.transcript?.trim();
      if (t) cb.current(t);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setSupported(true);
  }, []);

  const toggle = () => {
    const r = rec.current;
    if (!r) return;
    if (listening) r.stop();
    else {
      try {
        r.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  };
  return { supported, listening, toggle };
}
