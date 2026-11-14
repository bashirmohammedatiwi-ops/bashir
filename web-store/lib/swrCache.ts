/**
 * تخزين مؤقت في ذاكرة سيرفر الموقع مع «قديم أثناء التحديث» — بلا حدّ حجم.
 * كاش fetch في Next يرفض بصمت أي استجابة فوق 2MB ويبقى يقدّم آخر نسخة نجحت للأبد
 * (رئيسية «سحر الجمال» تجمّدت هكذا أياماً). هنا: النسخة الطازجة تُقدَّم مباشرة، والقديمة
 * تُقدَّم حتى maxStaleMs بينما يُجلب بديلها في الخلفية، وبعدها ننتظر الجديد. الفشل لا يمحو آخر نسخة سليمة.
 */
export type SwrOptions = { ttlMs: number; maxStaleMs: number; now?: () => number };

type Entry<T> = { value?: T; at: number; pending?: Promise<T> };

export function swrCache<T>(load: (key: string) => Promise<T>, opts: SwrOptions) {
  const now = opts.now ?? Date.now;
  const entries = new Map<string, Entry<T>>();

  const refresh = (key: string, entry: Entry<T>): Promise<T> => {
    if (entry.pending) return entry.pending;
    const pending = load(key).then(
      (value) => {
        entry.value = value;
        entry.at = now();
        entry.pending = undefined;
        return value;
      },
      (err) => {
        entry.pending = undefined;
        throw err;
      },
    );
    entry.pending = pending;
    return pending;
  };

  return (key: string): Promise<T> => {
    let entry = entries.get(key);
    if (!entry) {
      entry = { at: 0 };
      entries.set(key, entry);
    }
    if (entry.value === undefined) return refresh(key, entry);
    const age = now() - entry.at;
    if (age < opts.ttlMs) return Promise.resolve(entry.value);
    if (age < opts.maxStaleMs) {
      // تحديث في الخلفية؛ خطؤه لا يصل للزائر (تبقى النسخة السابقة).
      refresh(key, entry).catch(() => undefined);
      return Promise.resolve(entry.value);
    }
    return refresh(key, entry);
  };
}
