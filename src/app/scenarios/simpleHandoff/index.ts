import {
  RealtimeAgent,
  tool,
} from '@openai/agents/realtime';
import { memgraphMcp } from '@/app/lib/memgraphMcp';

const memgraphTools = await memgraphMcp.listTools();

export const memgraphExpert = new RealtimeAgent({
  name: 'memgraphExpert',
  voice: 'sage',
  instructions:
    'You are an expert in the Memgraph database. Answer user questions by running queries with the provided tools and summarize the results.',
  handoffs: [],
  tools: memgraphTools.map((t) =>
    tool({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
      execute: async (input: any) => {
        const result = await memgraphMcp.callTool(t.name, input);
        return { records: result };
      },
    }),
  ),
  handoffDescription: 'Agent that answers questions with Memgraph data',
});

export const greeterAgent = new RealtimeAgent({
  name: 'greeter',
  voice: 'sage',
  instructions:
    "Please greet the user and ask them if they'd like to talk to our Memgraph expert. If yes, hand off to the 'memgraphExpert' agent.",
  handoffs: [memgraphExpert],
  tools: [],
  handoffDescription: 'Agent that greets the user',
});

export const simpleHandoffScenario = [greeterAgent, memgraphExpert];

export default simpleHandoffScenario;
