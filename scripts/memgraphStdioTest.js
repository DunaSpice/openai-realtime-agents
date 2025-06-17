const { Agent } = require('@openai/agents');
const { OpenAI } = require('openai');
const readline = require('readline');
const neo4j = require('neo4j-driver');
require('dotenv').config();

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY not set. Aborting.');
  process.exit(1);
}

const openai = new OpenAI();

class MemgraphMCP {
  constructor() {
    this.name = 'memgraph';
    this.cacheToolsList = true;
    this.driver = null;
    this.tools = [
      {
        name: 'run_query',
        description: 'Run a Cypher query on Memgraph',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string', description: 'Cypher query' } },
          required: ['query'],
        },
        run: async ({ query }) => this.runQuery(query),
      },
      {
        name: 'get_configuration',
        description: 'Get Memgraph configuration information',
        parameters: { type: 'object', properties: {}, required: [] },
        run: async () => this.runQuery('SHOW CONFIG'),
      },
      {
        name: 'get_index',
        description: 'Get Memgraph index information',
        parameters: { type: 'object', properties: {}, required: [] },
        run: async () => this.runQuery('SHOW INDEX INFO'),
      },
      {
        name: 'get_constraint',
        description: 'Get Memgraph constraint information',
        parameters: { type: 'object', properties: {}, required: [] },
        run: async () => this.runQuery('SHOW CONSTRAINT INFO'),
      },
      {
        name: 'get_schema',
        description: 'Get Memgraph schema information',
        parameters: { type: 'object', properties: {}, required: [] },
        run: async () => this.runQuery('SHOW SCHEMA INFO'),
      },
      {
        name: 'get_storage',
        description: 'Get Memgraph storage information',
        parameters: { type: 'object', properties: {}, required: [] },
        run: async () => this.runQuery('SHOW STORAGE INFO'),
      },
      {
        name: 'get_triggers',
        description: 'Get Memgraph triggers information',
        parameters: { type: 'object', properties: {}, required: [] },
        run: async () => this.runQuery('SHOW TRIGGERS'),
      },
      {
        name: 'get_betweenness_centrality',
        description: 'Calculate betweenness centrality for nodes',
        parameters: {
          type: 'object',
          properties: {
            isDirectionIgnored: { type: 'boolean', default: true },
            limit: { type: 'integer', default: 10 },
          },
          required: [],
        },
        run: async ({ isDirectionIgnored = true, limit = 10 }) =>
          this.runQuery(
            'CALL betweenness_centrality.get($directed, True) YIELD node, betweenness_centrality RETURN node, betweenness_centrality ORDER BY betweenness_centrality DESC LIMIT $limit',
            { directed: !isDirectionIgnored, limit },
          ),
      },
      {
        name: 'get_page_rank',
        description: 'Calculate PageRank on the graph',
        parameters: {
          type: 'object',
          properties: { limit: { type: 'integer', default: 20 } },
          required: [],
        },
        run: async ({ limit = 20 }) =>
          this.runQuery(
            'CALL pagerank.get() YIELD node, rank RETURN node, rank ORDER BY rank DESC LIMIT $limit',
            { limit },
          ),
      },
    ];
  }

  getDriver() {
    if (!this.driver) {
      const url = process.env.MEMGRAPH_URL || 'bolt://localhost:7687';
      const user = process.env.MEMGRAPH_USER || 'neo4j';
      const password = process.env.MEMGRAPH_PASSWORD || '';
      this.driver = neo4j.driver(url, neo4j.auth.basic(user, password));
    }
    return this.driver;
  }

  async connect() {
    this.getDriver();
  }

  async close() {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }

  async runQuery(query, params = {}) {
    const session = this.getDriver().session();
    try {
      const result = await session.run(query, params);
      return result.records.map((r) => r.toObject());
    } finally {
      await session.close();
    }
  }

  async listTools() {
    return this.tools.map(({ name, description, parameters }) => ({
      name,
      description,
      parameters,
    }));
  }

  async callTool(toolName, args = {}) {
    const tool = this.tools.find((t) => t.name === toolName);
    if (!tool) throw new Error(`Unknown tool ${toolName}`);
    return tool.run(args);
  }
}

const mcp = new MemgraphMCP();

const agent = new Agent({
  name: 'memgraph-cli',
  instructions: 'Use MCP tools to answer the user. Execute Cypher queries when requested.',
  model: openai.chat.completions,
  mcpServers: [mcp],
});

(async () => {
  await mcp.connect();
  const tools = await mcp.listTools();
  console.log('Loaded tools:', tools.map((t) => t.name).join(', '));

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('Type messages for the agent. Type "exit" to quit.');

  const loop = () => {
    rl.question('You: ', async (line) => {
      if (line.trim() === 'exit') {
        rl.close();
        await mcp.close();
        return;
      }
      const result = await agent.run(line);
      console.log('Assistant:', result.output);
      loop();
    });
  };
  loop();
})();
