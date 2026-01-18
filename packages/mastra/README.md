# Database Introspection and Natural Language to SQL Workflow

This project provides a Mastra workflow system for database introspection and natural language to SQL conversion. It includes tools for analyzing database schemas, generating SQL queries from natural language descriptions, and executing queries safely.

## Features

- **Database Introspection**: Automatically analyzes PostgreSQL database schemas including tables, columns, relationships, and indexes
- **Natural Language to SQL**: Converts natural language queries into SQL using OpenAI's GPT models
- **Schema Presentation**: Generates human-readable documentation of database schemas
- **Safe Query Execution**: Only allows SELECT queries for security
- **Workflow Integration**: Built using Mastra workflows for orchestration and management

## Project Structure

```
src/
├── mastra/
│   ├── agents/
│   │   └── sql-agent.ts                    # SQL agent for Fusion Ponder database
│   ├── tools/
│   │   ├── database-introspection-tool.ts  # Database schema analysis
│   │   ├── sql-generation-tool.ts          # Natural language to SQL conversion
│   │   └── sql-execution-tool.ts           # Safe SQL query execution
│   ├── workflows/
│   │   └── database-query-workflow.ts      # Main workflow orchestration
│   ├── env.ts                              # Environment validation with Zod
│   └── index.ts                           # Mastra instance configuration

```

## Tools Overview

### 1. Database Introspection Tool (`database-introspection-tool.ts`)

Analyzes a PostgreSQL database to extract:

- Table structure and metadata
- Column definitions with types and constraints
- Primary key and foreign key relationships
- Index definitions
- Row counts for each table

**Input**: Database connection string
**Output**: Complete schema information with summary statistics

### 2. SQL Generation Tool (`sql-generation-tool.ts`)

Converts natural language queries to SQL using OpenAI's GPT-4:

- Analyzes database schema context
- Generates optimized SELECT queries
- Provides confidence scores and explanations
- Lists assumptions and tables used

**Input**: Natural language query + database schema
**Output**: SQL query with metadata and explanations

### 3. SQL Execution Tool (`sql-execution-tool.ts`)

Safely executes SQL queries:

- Restricts to SELECT queries only
- Manages connection pooling
- Provides detailed error handling
- Returns structured results

**Input**: Connection string + SQL query
**Output**: Query results or error information

## Enhanced SQL Agent

### Comprehensive Database Assistant

The SQL Agent (`sqlAgent`) now has the same capabilities as the workflow, providing a conversational interface for database operations:

#### **🔗 Database Connection & Analysis**

```typescript
const sqlAgent = mastra.getAgent('sqlAgent');

const result = await sqlAgent.generate(
  [
    {
      role: 'user',
      content: 'Connect to postgresql://user:password@localhost:5432/database and analyze the schema',
    },
  ],
  { maxSteps: 5 },
);
```

#### **🧠 Natural Language Queries**

```typescript
const result = await sqlAgent.generate(
  [
    {
      role: 'user',
      content: 'Show me the top 10 most populous cities in Europe',
    },
  ],
  { maxSteps: 5 },
);
```

#### **Agent Capabilities**

✅ **Multi-tool Orchestration** - Automatically uses the right tools for each task
✅ **Schema-Aware Queries** - Understands database structure for accurate SQL generation
✅ **Safe Execution** - Only allows SELECT queries with proper error handling
✅ **Conversational Interface** - Natural language interaction with detailed explanations
✅ **Read-Only** - Agent is pre-configured for Fusion Ponder database with no write capabilities

## Workflows

### Database Query Workflow (Multi-Step with Suspend/Resume)

The main workflow (`databaseQueryWorkflow`) is a multi-step interactive workflow pre-configured for the Fusion Ponder database:

#### Step 1: Schema Introspection

- **Automatically** introspects database schema (tables, columns, relationships, indexes)
- **Generates** human-readable schema presentation
- **Analyzes** database structure and relationships
- **Pre-configured** for Fusion Ponder database (no connection string needed)

#### Step 2: Natural Language to SQL Generation

- **Suspends** to collect natural language query from user
- **Shows** database schema information to help user formulate queries
- **Generates** SQL query using AI with confidence scores and explanations

#### Step 3: SQL Review and Execution

- **Suspends** to show generated SQL and get user approval
- **Allows** user to modify the SQL query if needed
- **Executes** the approved/modified query against the database
- **Returns** query results with metadata

**Usage**:

```typescript
const workflow = mastra.getWorkflow('databaseQueryWorkflow');
const run = await workflow.createRunAsync();

// Start workflow - automatically introspects the Fusion Ponder database
let result = await run.start({ inputData: {} });

// Step 1: Database introspection happens automatically

// Step 2: Provide natural language query
result = await run.resume({
  step: 'generate-sql',
  resumeData: { naturalLanguageQuery: 'Show me top 10 deposits by amount' },
});

// Step 3: Review and approve SQL
result = await run.resume({
  step: 'review-and-execute',
  resumeData: {
    approved: true,
    modifiedSQL: 'optional modified query',
  },
});
```

## Setup and Installation

1. **Install Dependencies**:

```bash
pnpm install
```

2. **Environment Setup**:
   Create a `.env` file with required environment variables:

```env
OPENAI_API_KEY=your-openai-api-key
PONDER_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54342/postgres
```

Note: `PONDER_DATABASE_URL` is required and validated with Zod at startup.

## Security Notes

- Only SELECT queries are allowed for security (read-only operations)
- Database connection is pre-configured via environment variable
- The system uses connection pooling for efficiency
- All database operations are logged for audit trails

## Current Features

✅ **Pre-configured for Fusion Ponder** - Automatically connects to the IPOR Fusion Ponder database
✅ **Database Schema Introspection** - Automatically analyzes database structure
✅ **Human-readable Documentation** - Generates beautiful schema presentations
✅ **Natural Language to SQL** - AI-powered query generation with explanations
✅ **Interactive Workflows** - Multi-step suspend/resume for human-in-the-loop
✅ **Conversational Agent** - Enhanced SQL agent with full workflow capabilities
✅ **SQL Review & Editing** - User can approve or modify generated queries
✅ **Safe Query Execution** - Only allows SELECT queries with result display
✅ **Read-Only Operations** - No write capabilities for data safety
✅ **Multi-tool Orchestration** - Agent automatically uses appropriate tools
✅ **Type Safety** - Full TypeScript support with Zod validation
✅ **Error Handling** - Comprehensive error management throughout workflow

## Dependencies

Key dependencies:

- `@mastra/core`: Workflow orchestration
- `@ai-sdk/openai`: AI integration
- `ai`: AI SDK for structured generation
- `pg`: PostgreSQL client
- `zod`: Schema validation
