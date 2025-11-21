import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Trash2, ExternalLink, NotebookPen, Lightbulb } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dossierStore } from '@/lib/dossiers';
import { generateResearchDossier } from '@/lib/gemini';
import type { ResearchDossier } from '@/types';

const focusExamples = [
  'What are the hottest AI agents to watch?',
  'Give me pros/cons for remote work policies.',
  'What are key learnings from latest Fed meeting?',
];

export function ResearchDossierPanel() {
  const [topic, setTopic] = useState('');
  const [focus, setFocus] = useState('');
  const [dossiers, setDossiers] = useState<ResearchDossier[]>([]);
  const [creating, setCreating] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDossiers = async () => {
    const data = await dossierStore.getAll();
    setDossiers(data);
  };

  useEffect(() => {
    loadDossiers();
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    try {
      setCreating(true);
      setError(null);
      const dossierPayload = await generateResearchDossier(topic.trim(), focus.trim());
      await dossierStore.create(dossierPayload);
      setTopic('');
      setFocus('');
      await loadDossiers();
    } catch (err) {
      console.error(err);
      setError('Could not build dossier. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleRefresh = async (dossier: ResearchDossier) => {
    try {
      setRefreshingId(dossier.id);
      setError(null);
      const payload = await generateResearchDossier(dossier.topic, dossier.focus);
      await dossierStore.update(dossier.id, {
        ...payload,
      });
      await loadDossiers();
    } catch (err) {
      console.error(err);
      setError('Refresh failed. Try again shortly.');
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    await dossierStore.delete(id);
    await loadDossiers();
  };

  return (
    <Card className="border-4 border-neutral-900 dark:border-dark-border shadow-te-brutal-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary-purple border-2 border-neutral-900 text-white">
            <NotebookPen className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>AI Research Dossiers</CardTitle>
            <CardDescription>
              Spin up briefing notes for any topic. Summaries, actionable next steps, and trusted references all inside LifeOS.
            </CardDescription>
          </div>
        </div>
        <div className="space-y-3">
          <Input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Topic or project you’re researching"
          />
          <Input
            value={focus}
            onChange={(event) => setFocus(event.target.value)}
            placeholder="Optional focus question (e.g., risks, comparisons, angles)"
          />
          <div className="flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-dark-subtext">
            {focusExamples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setFocus(example)}
                className="px-3 py-1 rounded-full border border-dashed border-neutral-400 hover:border-neutral-900 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!topic.trim() || creating}
              className="flex-1 md:flex-none md:px-8 font-mono"
            >
              {creating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Building dossier
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Build dossier
                </>
              )}
            </Button>
            {error && <p className="text-sm text-primary-red font-medium">{error}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {dossiers.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-neutral-400 p-6 text-center space-y-3">
            <Lightbulb className="h-8 w-8 mx-auto text-neutral-400" />
            <p className="text-neutral-600 dark:text-dark-subtext">
              No dossiers yet. Add a topic above to generate your first intelligence brief.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {dossiers.map((dossier) => (
              <Card key={dossier.id} className="border-2 border-neutral-900 dark:border-dark-border shadow-te-brutal-sm">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl">{dossier.topic}</CardTitle>
                      <p className="text-sm text-neutral-500 dark:text-dark-subtext">
                        Focus: {dossier.focus}
                      </p>
                    </div>
                    <span className="text-xs font-mono uppercase text-neutral-500">
                      Updated {formatDistanceToNow(new Date(dossier.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-dark-text">{dossier.summary}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold uppercase text-neutral-700 dark:text-dark-text mb-2">
                      Key Insights
                    </h4>
                    <ul className="space-y-1 text-sm text-neutral-600 dark:text-dark-subtext">
                      {dossier.keyInsights.map((insight, index) => (
                        <li key={index} className="flex gap-2">
                          <span>•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold uppercase text-neutral-700 dark:text-dark-text mb-2">
                      Action Items
                    </h4>
                    <ul className="space-y-1 text-sm text-neutral-600 dark:text-dark-subtext">
                      {dossier.actionItems.map((action, index) => (
                        <li key={index} className="flex gap-2">
                          <span>→</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {dossier.references.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold uppercase text-neutral-700 dark:text-dark-text mb-2">
                        References
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {dossier.references.map((reference, index) => (
                          <a
                            key={reference.url + index}
                            href={reference.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full border border-neutral-300 dark:border-dark-border text-primary-blue hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {reference.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRefresh(dossier)}
                      disabled={refreshingId === dossier.id}
                    >
                      {refreshingId === dossier.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Refreshing
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Refresh intel
                        </>
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(dossier.id)}>
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
