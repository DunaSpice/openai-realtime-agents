import { RealtimeAgent, tool } from '@openai/agents/realtime';
import { memgraphMcp } from '@/app/lib/memgraphMcp';

const memgraphTools = await memgraphMcp.listTools();

export const memgraphTestAgent = new RealtimeAgent({
  name: 'memgraphTester',
  voice: 'sage',
  instructions:
    'The user will provide a Cypher query. Use the Memgraph run_query tool to execute it and reply with the JSON result.',
  handoffs: [],
  tools: [
    tool({
      name: 'run_query',
      description: 'Run a Cypher query on Memgraph',
      parameters: memgraphTools.find((t) => t.name === 'run_query')!.parameters,
      execute: async (input: any) => {
        const result = await memgraphMcp.callTool('run_query', input);
        return { records: result };
      },
    }),
  ],
  handoffDescription: 'Agent for testing Memgraph queries',
});

export const memgraphTestScenario = [memgraphTestAgent];
