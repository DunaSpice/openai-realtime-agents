import type { RealtimeAgent } from '@openai/agents/realtime';

// Use Webpack's require.context to load all scenario modules eagerly
const req = (require as any).context('./', true, /index\.ts$/);

export const allAgentSets: Record<string, RealtimeAgent[]> = {};

req.keys().forEach((path: string) => {
  const match = path.match(/\.\/([^/]+)\/index\.ts$/);
  if (!match) return;
  const key = match[1];
  const mod = req(path);
  const scenario = mod.default ?? mod[`${key}Scenario`];
  if (scenario) {
    allAgentSets[key] = scenario as RealtimeAgent[];
  }
});

export const defaultAgentSetKey = 'chatSupervisor';
