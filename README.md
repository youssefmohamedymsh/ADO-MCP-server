# ado-mcp-server

An MCP (Model Context Protocol) server that wraps the Azure DevOps REST API,
allowing any MCP-compatible AI (Claude, Copilot, etc.) to query user stories,
create test cases, log bugs, and manage work items conversationally.

---

## Tools Included

| Tool | Description |
|---|---|
| `get_user_stories` | Fetch stories by sprint, state, or area path |
| `create_test_case` | Create a test case with steps and link to a story |
| `update_work_item` | Update state, title, or add a comment to any work item |
| `get_test_cases_for_story` | List all test cases linked to a story |
| `create_bug` | Log a bug with repro steps, linked to a test case |
| `get_sprint_coverage` | Report % of stories in a sprint that have test coverage |

---

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/your-org/ado-mcp-server.git
cd ado-mcp-server
npm install
```

### 2. Configure Environment

```bash
cp config/.env.example .env
# Edit .env and fill in ADO_ORG, ADO_PROJECT, ADO_PAT
```

**Creating a PAT in Azure DevOps:**
1. Go to `https://dev.azure.com/{your-org}/_usersSettings/tokens`
2. Click **New Token**
3. Grant scopes: **Work Items (Read & Write)** + **Test Plans (Read & Write)**
4. Copy the token into `.env` as `ADO_PAT`

### 3. Connect to Claude Desktop

Copy the contents of `config/claude_desktop_config.json` into your Claude Desktop config:

- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Update the path and credentials in the config, then **restart Claude Desktop**.

### 4. Verify

Open Claude Desktop — you should see the ADO tools available. Try:

> *"Show me all active user stories in Sprint 3"*

---

## Development

```bash
npm run dev        # Run with hot reload (tsx)
npm run typecheck  # TypeScript type checking
npm test           # Run unit tests
npm run build      # Compile to dist/
```

---

## Example Prompts

Once connected to Claude, you can say things like:

- *"Show me all active user stories in MyProject\\Sprint 4"*
- *"Create 3 test cases for user story #1042 and link them to it"*
- *"What test cases does story #887 have?"*
- *"Mark work item #2031 as Resolved and add a comment saying regression passed"*
- *"Log a bug for test case #1100 — the login button doesn't respond on mobile"*
- *"What's the test coverage for Sprint 3?"*

---

## Project Structure

```
ado-mcp-server/
├── src/
│   ├── tools/              # One file per MCP tool
│   │   ├── getUserStories.ts
│   │   ├── createTestCase.ts
│   │   ├── updateWorkItem.ts
│   │   ├── getTestCasesForStory.ts
│   │   ├── createBug.ts
│   │   └── getSprintCoverage.ts
│   ├── lib/                # Shared utilities
│   │   ├── adoClient.ts    # Axios instance with PAT auth
│   │   ├── formatSteps.ts  # ADO test steps XML formatter
│   │   └── wiql.ts         # WIQL query helper
│   ├── server.ts           # Entry point — registers all tools
│   └── types.ts            # Shared TypeScript interfaces
├── config/
│   ├── .env.example        # Template — commit this
│   └── claude_desktop_config.json
├── tests/                  # Unit tests (vitest)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Security

- Never commit `.env` — it's in `.gitignore`
- Rotate your PAT every 90 days
- Scope PAT to minimum required permissions
- For team use, consider a secrets manager (Azure Key Vault, 1Password) instead of `.env`

---

## License

MIT
