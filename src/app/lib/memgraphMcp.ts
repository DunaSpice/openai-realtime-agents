import type { MCPServer, MCPTool } from '@openai/agents'
import neo4j, { Driver } from 'neo4j-driver'

type ToolSpec = {
  name: string
  description: string
  parameters: Record<string, any>
  run: (args: Record<string, any>) => Promise<any>
}

/**
 * Minimal MCP server implementation for Memgraph using the Neo4j driver.
 * Follows the MCPServer interface from the Agents SDK.
 */
export class MemgraphMCP implements MCPServer {
  readonly name = 'memgraph'
  cacheToolsList = true

  private driver: Driver | null = null

  private getDriver(): Driver {
    if (!this.driver) {
      const url = process.env.MEMGRAPH_URL ?? 'bolt://localhost:7687'
      const user = process.env.MEMGRAPH_USER ?? 'neo4j'
      const password = process.env.MEMGRAPH_PASSWORD ?? ''
      this.driver = neo4j.driver(url, neo4j.auth.basic(user, password))
    }
    return this.driver
  }

  async connect(): Promise<void> {
    this.getDriver()
  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close()
      this.driver = null
    }
  }

  private async runQuery(query: string, params: Record<string, any> = {}) {
    const session = this.getDriver().session()
    try {
      const result = await session.run(query, params)
      return result.records.map((r) => r.toObject())
    } finally {
      await session.close()
    }
  }

  private tools: ToolSpec[] = [
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
  ]

  async listTools(): Promise<MCPTool[]> {
    await this.connect()
    return this.tools.map(({ name, description, parameters }) => ({
      name,
      description,
      parameters,
    })) as MCPTool[]
  }

  async callTool(
    toolName: string,
    args: Record<string, unknown> | undefined,
  ): Promise<any> {
    const tool = this.tools.find((t) => t.name === toolName)
    if (!tool) throw new Error(`Unknown tool ${toolName}`)
    return tool.run(args ?? {})
  }
}

export const memgraphMcp = new MemgraphMCP()
