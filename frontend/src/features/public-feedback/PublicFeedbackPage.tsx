import { FormEvent, useState } from 'react';
import { Card } from '@/components/Card';
import { apiFetch } from '@/lib/api';

export function PublicFeedbackPage() {
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const [points, setPoints] = useState(0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!stars) return;
    const res = await apiFetch('public/feedback', {
      method: 'POST',
      body: JSON.stringify({ stars, text }),
    });
    const json = await res.json();
    setDone(true);
    setPoints(json.points ?? 0);
  }

  return (
    <Card className="glass-auth-card !max-w-none">
      <h1 className="text-xl font-extrabold text-ink text-center">How was your visit?</h1>
      {done ? (
        <p className="mt-6 text-center text-sm text-secondary">Thank you! You earned {points} loyalty points.</p>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                className={`text-3xl ${stars >= n ? 'text-amber-400' : 'text-muted opacity-40'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="inp min-h-[80px]"
            placeholder="Tell us more (optional)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="btn-primary btn-full !h-11">
            Submit feedback
          </button>
        </form>
      )}
    </Card>
  );
}