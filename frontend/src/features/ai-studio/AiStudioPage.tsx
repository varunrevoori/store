import { useState } from 'react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { PageError, PageLoading } from '@/components/ui/PageState';
import { useTenant } from '@/context/TenantContext';
import { useFetch } from '@/hooks/useFetch';

type Insight = { id: string; title: string; text: string; impact: string };

export function AiStudioPage() {
  const { ready } = useTenant();
  const { data, loading, error } = useFetch<{
    insights: Insight[];
    voiceLive: boolean;
    automations: Record<string, boolean>;
    transcript: { who: string; text: string; lang?: string }[];
  }>(ready ? 'ai/studio' : '', [ready]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  if (loading) return <PageLoading label="Loading AI Studio…" />;
  if (error || !data) return <PageError>Could not load AI Studio.</PageError>;

  function ask() {
    setAnswer(
      question.toLowerCase().includes('no-show')
        ? 'No-shows are at 3.2% this week. Enable ₹200 deposit for first-time colour bookings.'
        : 'Revenue is on track at ₹24.6L MoM +11.8%. Focus on filling Tue–Wed afternoon slots.',
    );
  }

  return (
    <div>
      <PageHeader
        title="AI Studio"
        subtitle={data.voiceLive ? 'Insights from your live salon data' : 'AI offline'}
      />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-semibold text-hot mb-3 text-[15px]">Business advisor</h2>
          <ul className="space-y-3">
            {data.insights.map((i) => (
              <li key={i.id} className="panel-inset ai-insight text-sm">
                <div className="flex justify-between gap-2 font-semibold text-ink">
                  <span>{i.title}</span>
                  <span className="text-hot whitespace-nowrap">{i.impact}</span>
                </div>
                <p className="text-secondary mt-1">{i.text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <input
              className="inp flex-1 !h-10"
              placeholder="Ask anything…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button type="button" onClick={ask} className="btn-primary shrink-0">
              Ask
            </button>
          </div>
          {answer ? <p className="text-sm mt-3 panel-inset text-secondary">{answer}</p> : null}
        </Card>
        <Card>
          <h2 className="font-semibold text-ink mb-3 text-[15px]">Voice transcript</h2>
          <ul className="space-y-2 text-sm text-secondary">
            {data.transcript.map((t, idx) => (
              <li key={idx}>
                <span className={t.who === 'ai' ? 'text-sky2 font-semibold' : 'text-muted font-semibold'}>
                  {t.who === 'ai' ? 'LonSa AI' : 'Caller'}
                </span>
                : {t.text}
              </li>
            ))}
          </ul>
          <h3 className="font-semibold mt-4 mb-2 text-xs uppercase text-muted tracking-wide">Automations</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.automations).map(([k, on]) => (
              <span key={k} className={`text-xs px-2 py-1 rounded-full ${on ? 'chip-on' : 'chip-off'}`}>
                {k} {on ? 'on' : 'off'}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}