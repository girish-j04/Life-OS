import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  ExternalLink,
  Smartphone,
  Sparkles,
  Loader2,
  Filter,
  ListChecks,
  Globe
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  score: number;
  numComments: number;
  permalink: string;
  createdUtc: number;
  flair?: string | null;
  selftext?: string;
}

interface GoogleResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

const searchIntents = [
  {
    id: 'recommendations',
    label: 'Recommendations',
    helper: 'best recommendations from real users',
  },
  {
    id: 'reviews',
    label: 'Honest Opinions',
    helper: 'honest opinions and experiences',
  },
  {
    id: 'buying',
    label: 'Buying Advice',
    helper: 'what to buy, what to avoid',
  },
  {
    id: 'issues',
    label: 'Troubleshooting',
    helper: 'common issues and fixes',
  },
];

const boosterTags = [
  { label: '2024', value: '2024' },
  { label: 'Beginner Friendly', value: '"beginner friendly"' },
  { label: 'Underrated', value: 'underrated' },
  { label: 'AMA', value: 'AMA' },
  { label: 'Megathread', value: 'megathread' },
  { label: 'Recommendations', value: 'recommendations' },
];

const quickQueries = [
  'best new horror movies',
  'budget mechanical keyboard',
  'solo japan itinerary',
  'home gym setup advice',
];

const timeRanges = [
  { id: 'all', label: 'All time' },
  { id: 'year', label: 'Past year' },
  { id: 'month', label: 'Past month' },
  { id: 'week', label: 'Past week' },
  { id: 'day', label: 'Past 24h' },
];

const sortOptions = [
  { id: 'relevance', label: 'Relevant' },
  { id: 'top', label: 'Top' },
  { id: 'new', label: 'New' },
  { id: 'hot', label: 'Hot' },
];

export function RedditScout() {
  const [query, setQuery] = useState('');
  const [subreddit, setSubreddit] = useState('');
  const [intent, setIntent] = useState(searchIntents[0]?.id ?? '');
  const [boosters, setBoosters] = useState<string[]>([]);
  const [sort, setSort] = useState(sortOptions[0].id);
  const [timeRange, setTimeRange] = useState(timeRanges[0].id);
  const [redditLoading, setRedditLoading] = useState(false);
  const [redditError, setRedditError] = useState<string | null>(null);
  const [results, setResults] = useState<RedditPost[]>([]);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [googleResults, setGoogleResults] = useState<GoogleResult[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [hasGoogleSearched, setHasGoogleSearched] = useState(false);

  const buildSearchTokens = () => {
    const tokens = [query.trim()];
    const selectedIntent = searchIntents.find((item) => item.id === intent);
    if (selectedIntent) {
      tokens.push(selectedIntent.helper);
    }
    if (subreddit.trim()) {
      tokens.push(`"${subreddit.trim()}"`);
    }
    tokens.push('site:reddit.com');
    boosters.forEach((tag) => tokens.push(tag));
    return tokens.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  };

  const googleUrl = useMemo(() => {
    if (!query.trim()) return '';
    return `https://www.google.com/search?q=${encodeURIComponent(buildSearchTokens())}`;
  }, [boosters, intent, query, subreddit]);

  const runGoogleSearch = () => {
    if (!googleUrl) return;
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleBooster = (value: string) => {
    setBoosters((prev) =>
      prev.includes(value) ? prev.filter((tag) => tag !== value) : [...prev, value]
    );
  };

  const fetchRedditPreview = async () => {
    if (!query.trim()) return;
    try {
      setHasPreviewed(true);
      setRedditLoading(true);
      setRedditError(null);
      const searchTerm = buildSearchTokens().replace('site:reddit.com', '').trim();
      const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(
        searchTerm
      )}&sort=${sort}&t=${timeRange}&limit=12&raw_json=1`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch Reddit results');
      }
      const data = await response.json();
      const posts: RedditPost[] = data?.data?.children?.map((item: any) => {
        const child = item.data;
        return {
          id: child.id,
          title: child.title,
          subreddit: child.subreddit_name_prefixed ?? child.subreddit,
          author: child.author,
          score: child.score,
          numComments: child.num_comments,
          permalink: child.permalink,
          createdUtc: child.created_utc,
          flair: child.link_flair_text,
          selftext: child.selftext,
        };
      }) ?? [];
      setResults(posts);
    } catch (err) {
      console.error(err);
      setRedditError('Could not load Reddit preview. Try again or jump straight to Google.');
    } finally {
      setRedditLoading(false);
    }
  };

  const renderMeta = (post: RedditPost) => {
    const age = formatDistanceToNow(new Date(post.createdUtc * 1000), { addSuffix: true });
    return `${post.subreddit} • ${post.score.toLocaleString()} upvotes • ${post.numComments} comments • ${age}`;
  };

  const buildRedditAppLink = (permalinkOrUrl: string) => {
    const safeLink = permalinkOrUrl.startsWith('http')
      ? permalinkOrUrl
      : `https://www.reddit.com${permalinkOrUrl}`;
    try {
      const url = new URL(safeLink);
      return `reddit://${url.host}${url.pathname}`;
    } catch {
      return safeLink;
    }
  };

  const cleanGoogleUrl = (raw: string) => {
    if (!raw) return '';
    if (raw.startsWith('/url?')) {
      const params = new URLSearchParams(raw.replace('/url?', ''));
      return params.get('q') ?? '';
    }
    return raw;
  };

  const extractGoogleResults = (html: string): GoogleResult[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks = Array.from(doc.querySelectorAll('div.g'));
    const parsed: GoogleResult[] = [];
    const seen = new Set<string>();

    const pushResult = (url: string, title: string, snippet: string) => {
      if (!url || seen.has(url) || !url.includes('reddit.com')) return;
      seen.add(url);
      let source = '';
      try {
        source = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        source = 'reddit.com';
      }
      parsed.push({
        url,
        title: title || 'Reddit thread',
        snippet,
        source,
      });
    };

    blocks.forEach((block) => {
      const anchor = block.querySelector('a[href]');
      if (!anchor) return;
      const href = cleanGoogleUrl(anchor.getAttribute('href') ?? '');
      if (!href) return;
      const title = block.querySelector('h3')?.textContent?.trim() ?? anchor.textContent?.trim() ?? '';
      const snippet =
        block.querySelector('.VwiC3b')?.textContent?.trim() ??
        block.querySelector('.IsZvec')?.textContent?.trim() ??
        '';
      pushResult(href, title, snippet);
    });

    if (!parsed.length) {
      const redditAnchors = Array.from(doc.querySelectorAll('a[href*="reddit.com"]'));
      redditAnchors.forEach((anchor) => {
        const href = cleanGoogleUrl(anchor.getAttribute('href') ?? '');
        if (!href) return;
        const title = anchor.textContent?.trim() ?? '';
        const snippet = anchor.parentElement?.textContent?.trim() ?? '';
        pushResult(href, title, snippet);
      });
    }

    return parsed.slice(0, 10);
  };

  const fetchGoogleResults = async () => {
    if (!query.trim()) return;
    try {
      setHasGoogleSearched(true);
      setGoogleLoading(true);
      setGoogleError(null);
      const tokens = buildSearchTokens();
      const response = await fetch(
        `https://r.jina.ai/http://www.google.com/search?q=${encodeURIComponent(tokens)}&num=10&hl=en`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch Google results');
      }
      const html = await response.text();
      const parsed = extractGoogleResults(html);
      setGoogleResults(parsed);
      if (!parsed.length) {
        setGoogleError('No Google matches parsed. Try tweaking the query or open Google directly.');
      }
    } catch (err) {
      console.error(err);
      setGoogleError('Could not fetch Google results. Google may be blocking automated requests.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleScout = async () => {
    if (!query.trim()) return;
    await Promise.allSettled([fetchGoogleResults(), fetchRedditPreview()]);
  };

  const isScouting = redditLoading || googleLoading;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg transition-colors pb-24">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-display font-bold text-neutral-900 dark:text-dark-text">
            Reddit Scout
          </h1>
          <p className="text-neutral-600 dark:text-dark-subtext font-mono text-xs tracking-widest uppercase">
            Build smarter searches, launch Google with one tap, and jump into the Reddit app instantly.
          </p>
        </div>

        <Card className="border-4 border-neutral-900 dark:border-dark-border shadow-te-brutal-sm">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-orange rounded-2xl border-2 border-neutral-900">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Search builder</CardTitle>
                <CardDescription>
                  Stack intents, filters, and boosters to make Google surface the exact Reddit threads you want.
                </CardDescription>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700 dark:text-dark-text uppercase">
                Topic or question
              </label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="e.g. best new horror movies"
                  className="flex-1"
                />
                <Button onClick={runGoogleSearch} disabled={!googleUrl} className="font-mono">
                  <ExternalLink className="h-4 w-4" />
                  Open Google
                </Button>
              </div>
              <p className="text-xs text-neutral-500 dark:text-dark-subtext mt-1">
                Builds a query like: <span className="font-mono text-neutral-900 dark:text-dark-text">{buildSearchTokens() || '—'}</span>
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase text-neutral-700 dark:text-dark-text mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Intent presets
              </p>
              <div className="grid grid-cols-2 gap-3">
                {searchIntents.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setIntent(preset.id)}
                    className={cn(
                      'rounded-2xl border-2 border-neutral-900 dark:border-dark-border p-3 text-left transition-all',
                      intent === preset.id
                        ? 'bg-primary-blue text-white shadow-te-brutal-sm'
                        : 'bg-white dark:bg-dark-surface text-neutral-900 dark:text-dark-text hover:bg-neutral-100 dark:hover:bg-dark-surface2'
                    )}
                  >
                    <p className="text-sm font-bold">{preset.label}</p>
                    <p className="text-xs text-neutral-500 dark:text-dark-subtext mt-1">{preset.helper}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase text-neutral-700 dark:text-dark-text">Optional subreddit focus</p>
              <Input
                value={subreddit}
                onChange={(event) => setSubreddit(event.target.value)}
                placeholder='e.g. r/horror, r/MechanicalKeyboards'
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase text-neutral-700 dark:text-dark-text">Boosters</p>
              <div className="flex flex-wrap gap-2">
                {boosterTags.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => toggleBooster(tag.value)}
                    className={cn(
                      'px-3 py-1 rounded-full border-2 border-neutral-900 dark:border-dark-border text-xs font-mono uppercase transition-all',
                      boosters.includes(tag.value)
                        ? 'bg-primary-purple text-white'
                        : 'bg-white dark:bg-dark-surface text-neutral-700 dark:text-dark-text'
                    )}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase text-neutral-700 dark:text-dark-text flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Quick suggestions
              </p>
              <div className="flex flex-wrap gap-2">
                {quickQueries.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="px-3 py-2 rounded-2xl border-2 border-dashed border-neutral-400 text-sm font-mono text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 dark:text-dark-subtext"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase text-neutral-700 dark:text-dark-text flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Reddit preview filters
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs text-neutral-500 dark:text-dark-subtext">Sort</p>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map((option) => (
                      <Button
                        key={option.id}
                        size="sm"
                        variant={sort === option.id ? 'default' : 'secondary'}
                        onClick={() => setSort(option.id)}
                        className="flex-1"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-neutral-500 dark:text-dark-subtext">Time range</p>
                  <div className="flex flex-wrap gap-2">
                    {timeRanges.map((range) => (
                      <Button
                        key={range.id}
                        size="sm"
                        variant={timeRange === range.id ? 'default' : 'secondary'}
                        onClick={() => setTimeRange(range.id)}
                        className="flex-1"
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleScout}
                disabled={!query.trim() || isScouting}
                className="flex-1 md:flex-none md:px-8 font-mono"
              >
                {isScouting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scouting
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Scout inside LifeOS
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => fetchRedditPreview()}
                disabled={!query.trim() || redditLoading}
                className="flex-1 md:flex-none md:px-6 font-mono"
              >
                {redditLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reddit only
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Reddit only
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={runGoogleSearch}
                disabled={!googleUrl}
                className="flex-1 md:flex-none md:px-6 font-mono"
              >
                <ExternalLink className="h-4 w-4" />
                Open Google (optional)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-4 border-neutral-900 dark:border-dark-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-blue rounded-2xl border-2 border-neutral-900">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Google-ranked Reddit hits</CardTitle>
                <CardDescription>
                  Top Google results filtered to Reddit. The order mirrors what you would see on Google without leaving LifeOS.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasGoogleSearched && (
              <p className="text-neutral-500 dark:text-dark-subtext text-sm">
                Run <span className="font-semibold">Scout inside LifeOS</span> above to pull Google&apos;s top Reddit hits directly into this view.
              </p>
            )}

            {googleError && (
              <div className="rounded-xl border-2 border-primary-red bg-primary-red/10 text-primary-red p-4 text-sm">
                {googleError}
              </div>
            )}

            {googleLoading && (
              <div className="flex items-center gap-3 text-neutral-600 dark:text-dark-subtext">
                <Loader2 className="h-5 w-5 animate-spin" />
                Fetching Google-ranked threads…
              </div>
            )}

            {!googleLoading && googleResults.length === 0 && hasGoogleSearched && !googleError && (
              <p className="text-neutral-600 dark:text-dark-subtext text-sm">
                Google didn&apos;t return anything we could parse. Try loosening boosters or change the intent preset.
              </p>
            )}

            <div className="space-y-4">
              {googleResults.map((result, index) => (
                <motion.div
                  key={result.url + index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border-2 border-neutral-900 dark:border-dark-border bg-white dark:bg-dark-surface p-4 shadow-te-brutal-sm"
                >
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-mono text-neutral-500 dark:text-dark-subtext uppercase tracking-wide">
                      #{index + 1} • {result.source}
                    </p>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-dark-text">{result.title}</h3>
                    {result.snippet && (
                      <p className="text-sm text-neutral-600 dark:text-dark-subtext">
                        {result.snippet}
                      </p>
                    )}
                    <p className="text-xs text-neutral-500 dark:text-dark-subtext break-all">
                      {result.url}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => window.open(result.url, '_blank', 'noopener,noreferrer')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open on web
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const appLink = buildRedditAppLink(result.url);
                          window.open(appLink, '_blank');
                        }}
                      >
                        <Smartphone className="h-4 w-4" />
                        Jump to app
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-4 border-neutral-900 dark:border-dark-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-green rounded-2xl border-2 border-neutral-900">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Reddit preview</CardTitle>
                <CardDescription>
                  Peek at the top threads before you jump into the Reddit app. Tap any card to open directly in the app.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasPreviewed && (
              <p className="text-neutral-500 dark:text-dark-subtext text-sm">
                Build a query above and hit <span className="font-semibold">Scout inside LifeOS</span> (or <span className="font-semibold">Reddit only</span>) to fetch real posts without leaving LifeOS.
              </p>
            )}

            {redditError && (
              <div className="rounded-xl border-2 border-primary-red bg-primary-red/10 text-primary-red p-4 text-sm">
                {redditError}
              </div>
            )}

            {redditLoading && (
              <div className="flex items-center gap-3 text-neutral-600 dark:text-dark-subtext">
                <Loader2 className="h-5 w-5 animate-spin" />
                Fetching Reddit threads…
              </div>
            )}

            {!redditLoading && results.length === 0 && hasPreviewed && !redditError && (
              <p className="text-neutral-600 dark:text-dark-subtext text-sm">
                No threads found for this combo. Try switching subreddits, expanding the time range, or tweaking the boosters.
              </p>
            )}

            <div className="space-y-4">
              {results.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border-2 border-neutral-900 dark:border-dark-border bg-white dark:bg-dark-surface p-4 shadow-te-brutal-sm"
                >
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-mono text-neutral-500 dark:text-dark-subtext uppercase tracking-wide">
                      {renderMeta(post)}
                    </p>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-dark-text">{post.title}</h3>
                    {post.flair && (
                      <span className="self-start text-xs font-semibold uppercase px-2 py-1 rounded-full bg-primary-blue/10 text-primary-blue border-2 border-primary-blue/30">
                        {post.flair}
                      </span>
                    )}
                    {post.selftext && (
                      <p className="text-sm text-neutral-600 dark:text-dark-subtext line-clamp-3">
                        {post.selftext}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => window.open(`https://www.reddit.com${post.permalink}`, '_blank', 'noopener,noreferrer')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open on web
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const appLink = buildRedditAppLink(post.permalink);
                          window.open(appLink, '_blank');
                        }}
                      >
                        <Smartphone className="h-4 w-4" />
                        Jump to app
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
