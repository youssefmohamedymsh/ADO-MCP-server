# ado-mcp-server

An MCP (Model Context Protocol) server that wraps the Azure DevOps REST API,
allowing any MCP-compatible AI (Claude, Copilot, etc.) to query user stories,
create test cases, log bugs, and manage work items conversationally.

---

## Tools Included (24 Total)

### Query & Retrieve
| Tool | Description |
|---|---|
| `get_user_stories` | Fetch user stories by sprint, state, or area path with filters |
| `get_work_item` | Retrieve a single work item by ID with full details |
| `get_child_work_items` | Get all child items (tasks, subtasks) of a work item |
| `get_test_cases_for_story` | List all test cases linked to a user story |
| `get_team_members` | Fetch team members and their details from the project |
| `get_test_runs` | Retrieve recent test runs with pass/fail counts |
| `get_sprint_coverage` | Report test coverage % for stories in a sprint |
| `get_bugs` | Retrieve bugs by sprint, state, or area with filters |
| `get_work_item_comments` | Get all comments and discussions on a work item |
| `get_work_item_updates` | Get revision history and state changes for a work item |
| `get_sprints` | List all sprints/iterations in the project |
| `get_area_paths` | List all area paths and team areas in the project |
| `get_board_columns` | Get current board columns and workflow state |
| `search_work_items` | Search work items using flexible query criteria |
| `list_projects` | List all projects in the Azure DevOps organization |

### Create & Manage
| Tool | Description |
|---|---|
| `create_test_case` | Create a test case with steps and link to a story |
| `create_bug` | Log a bug with reproduction steps, linked to a test case |
| `create_child_task` | Create a child task and link it to a parent work item |
| `create_user_story` | Create a new user story with acceptance criteria |
| `create_epic_or_feature` | Create an epic or feature work item |
| `update_work_item` | Update state, title, priority, or add comments to any work item |
| `assign_work_item` | Assign a work item to a team member |
| `bulk_assign_work_items` | Assign multiple work items to the same user |
| `link_work_items` | Create relationships between work items (parent/child, related, tested-by, etc) |
| `add_attachment` | Attach files to a work item |

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

### Validation

Before committing, validate that all tool files are properly exported:

```bash
node scripts/validateTools.mjs
```

This script checks:
- All tool files exist and have proper exports
- Tool exports match server registrations
- TypeScript compilation succeeds

---

## Documentation

For a detailed explanation of how the project is structured, how each component works, and how to implement new tools, see **[PROJECT_EXPLANATION.md](PROJECT_EXPLANATION.md)**. This comprehensive guide covers:

- Project architecture and data flow
- MCP protocol and server communication
- Core components (adoClient, wiql, formatSteps, types)
- Tool implementation patterns
- Configuration and setup steps
- Example workflows
- Common troubleshooting issues

This is the recommended reading for team members learning the codebase.

---

## Example Prompts

Once connected to Claude, you can say things like:

### Query & Retrieve
- *"Show me all active user stories in MyProject\\Sprint 4"*
- *"Get details for work item #1042"*
- *"What child tasks are assigned to story #887?"*
- *"Who are the team members on this project?"*
- *"What test runs have failed recently?"*
- *"What's the test coverage for Sprint 3?"*
- *"List all bugs in the current sprint"*
- *"Show me all comments on work item #2050"*
- *"What changes have been made to story #1005 recently?"*
- *"List all sprints in the project"*
- *"What area paths does our team use?"*
- *"Search for work items containing 'login'*"
- *"What projects exist in our organization?"*

### Create & Update
- *"Create 3 test cases for user story #1042 and link them to it"*
- *"Log a bug for test case #1100 — the login button doesn't respond on mobile"*
- *"Create a child task under story #1042 to review acceptance criteria"*
- *"Create a new user story titled 'User authentication' with acceptance criteria"*
- *"Create an epic called 'Payment System Redesign'"*
- *"Mark work item #2031 as Resolved and add a comment saying regression passed"*
- *"Assign work item #1050 to John Smith"*
- *"Assign all bugs in Sprint 4 to the QA team lead"*
- *"Link work item #999 as a parent to #1000, #1001, and #1002"*
- *"Attach the test results PDF to work item #1200"*

---

## Project Structure

```
ado-mcp-server/
├── src/
│   ├── tools/                    # One file per MCP tool (24 total)
│   │   ├── addAttachment.ts
│   │   ├── assignWorkItem.ts
│   │   ├── bulkAssignWorkItems.ts
│   │   ├── createBug.ts
│   │   ├── createChildTask.ts
│   │   ├── createEpicOrFeature.ts
│   │   ├── createTestCase.ts
│   │   ├── createUserStory.ts
│   │   ├── getAreaPaths.ts
│   │   ├── getBoardColumns.ts
│   │   ├── getBugs.ts
│   │   ├── getChildWorkItems.ts
│   │   ├── getSprintCoverage.ts
│   │   ├── getSprints.ts
│   │   ├── getTeamMembers.ts
│   │   ├── getTestCasesForStory.ts
│   │   ├── getTestRuns.ts
│   │   ├── getUserStories.ts
│   │   ├── getWorkItem.ts
│   │   ├── getWorkItemComments.ts
│   │   ├── getWorkItemUpdates.ts
│   │   ├── linkWorkItems.ts
│   │   ├── listProjects.ts
│   │   └── searchWorkItems.ts
│   ├── lib/                      # Shared utilities
│   │   ├── adoClient.ts          # Axios instance with PAT auth
│   │   ├── formatSteps.ts        # ADO test steps XML formatter
│   │   └── wiql.ts               # WIQL query helper
│   ├── server.ts                 # Entry point — registers all tools
│   └── types.ts                  # Shared TypeScript interfaces
├── config/
│   ├── .env.example              # Template — commit this
│   └── claude_desktop_config.json
├── tests/                        # Unit + validation tests
├── scripts/
│   └── validateTools.mjs         # Tool export validation script
├── .github/
│   └── workflows/
│       └── test.yml              # CI/CD - tests on every push/PR
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
