import type { RealtimeAgent } from '@openai/agents/realtime';

// Eagerly import all scenario modules under this directory
const modules = import.meta.glob('./*/index.ts', { eager: true }) as Record<string, any>;

export const allAgentSets: Record<string, RealtimeAgent[]> = {};

for (const path in modules) {
  const key = path.split('/')[1]; // './scenarioName/index.ts'
  const mod = modules[path];
  const scenario = mod.default ?? mod[`${key}Scenario`];
  if (scenario) {
    allAgentSets[key] = scenario as RealtimeAgent[];
  }
}

export const defaultAgentSetKey = 'chatSupervisor';
