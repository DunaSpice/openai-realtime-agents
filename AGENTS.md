# AGENTS.md

## 1. Purpose and Scope  
**Objective:** Future proof agent creation playground and hub. Where all information about ai technology is blended into magical ai software solutions.
**Audience:** Codex, Developers, AI tool integrators

## 2. High-Level Instructions  
**Primary:**Please use this agents.md file to store information that would be usefull for reload. Storing in a separate file and reference to other .md is prefered for long instruction.
**Secondary:** Please find info about memgraph instalation in this env in MEMGRAPH_SETUP.md 
### 3. Low level instructions

#### Memgraph MCP

The project includes a lightweight MCP implementation for Memgraph located at `src/app/lib/memgraphMcp.ts`. It exposes the following tools:

- `run_query`
- `get_configuration`
- `get_index`
- `get_constraint`
- `get_schema`
- `get_storage`
- `get_triggers`
- `get_betweenness_centrality`
- `get_page_rank`


These tools follow the `MCPServer` interface from the OpenAI Agents SDK and are wired into the `memgraphExpert` configuration in `src/app/agentConfigs/simpleHandoff.ts`.

For quick validation of the Memgraph connection there is also a `memgraphTestAgent` defined in `src/app/agentConfigs/memgraphTest.ts`. It exposes only the `run_query` tool so you can submit Cypher statements directly and view the raw results.

The MCP connects to a running Memgraph instance using the Neo4j JavaScript driver.
Configure access with the following environment variables:

- `MEMGRAPH_URL` – bolt URL (default `bolt://localhost:7687`)
- `MEMGRAPH_USER` – username (default `neo4j`)
- `MEMGRAPH_PASSWORD` – password (default empty)

#### STDIO agent testing

A simple CLI wrapper exists at `scripts/memgraphStdioTest.js`. It now uses a
lightweight JavaScript MCP implementation instead of spawning the Python
`mcp-memgraph` process. Start a Memgraph server (see `MEMGRAPH_SETUP.md`) and
run:

```bash
npm install
OPENAI_API_KEY=your-key node scripts/memgraphStdioTest.js
```

If `OPENAI_API_KEY` is missing the script will abort with an error message.

Type prompts and the agent will respond using Memgraph tools. Enter `exit` to
quit.

