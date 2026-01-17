# MCP Server Configuration

This directory contains the MCP (Model Context Protocol) server configuration for Cursor.

## Configuration File

The `.cursor/mcp.json` file configures MCP servers that Cursor can use to interact with your local database and documentation.

## Configured Servers

### 1. Mastra MCP Server

The `mastra` server provides access to Mastra AI documentation. It automatically downloads and uses the latest version via `npx`.

### 2. Supabase Ponder Database

The `supabase-ponder-db` server connects to your local Supabase instance via HTTP endpoint at `http://127.0.0.1:54331/mcp`.

This is the same Supabase instance that Ponder uses for blockchain indexing. Configuration is in `packages/supabase-ponder/`.

## Starting the Database

Before using MCP or running Ponder, start the local Supabase instance:

```bash
cd packages/supabase-ponder
supabase start
```

This starts:
- **Port 54331** - Supabase API (REST, used by MCP)
- **Port 54332** - PostgreSQL database (used by Ponder)
- **Port 54333** - Supabase Studio (database browser)

## Verification

After starting Supabase:

1. Restart Cursor
2. Go to **Settings → Features → MCP Servers**
3. Verify that both servers show as active (green status)
4. Check that tools are available for each server
