import {
  RealtimeAgent,
  tool,
} from '@openai/agents/realtime';
import { memgraphMcp } from '@/app/lib/memgraphMcp';

const memgraphTools = await memgraphMcp.listTools();

export const haikuWriterAgent = new RealtimeAgent({
  name: 'haikuWriter',
  voice: 'sage',
  instructions:
    'Ask the user for a topic, then reply with a haiku about that topic. If the user asks about graph data, use the Memgraph tools to run queries and include a short summary of the results.',
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
  handoffDescription: 'Agent that writes haikus',
});

export const greeterAgent = new RealtimeAgent({
  name: 'greeter',
  voice: 'sage',
  instructions:
    "Please greet the user and ask them if they'd like a Haiku. If yes, hand off to the 'haiku' agent.",
  handoffs: [haikuWriterAgent],
  tools: [],
  handoffDescription: 'Agent that greets the user',
});

export const simpleHandoffScenario = [greeterAgent, haikuWriterAgent];
