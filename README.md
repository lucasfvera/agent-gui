# Skills Manager

Local web GUI for managing Claude Code/Agent skills.

## Run

```bash
npm start
```

Server runs at `http://localhost:3000`

## Test

```bash
npm test
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/roots` | List all skill roots (.cursor, .agents, .opencode, etc.) |
| `GET /api/groups/:root` | List groups for a root (only .cursor has groups) |
| `GET /api/skills?root=&group=` | List skills in a root/group |
| `GET /api/skill/:root/:skill?group=` | Get skill content + references |
| `POST /api/skill/toggle/:root/:skill?group=` | Enable/disable a skill |
| `GET /api/health` | Health check |

## Structure

```
server/
├── config.js           # Constants
├── index.js           # HTTP server + routing
├── controllers/       # Request handlers
├── services/          # Business logic
└── utils/             # Logger, URL parser
```

## How it works

- Scans `.cursor`, `.agents`, `.codex`, `.gemini`, `.opencode`, `.warp`, `.claude` directories
- For `.cursor`, groups skills into: skills, skills-cursor, superpowers, notion-workspace, compound-engineering
- Disabling a skill moves its folder to `temp_disabled_skills/` at the root level
- Skills are detected by `SKILL.md` files

## Tech

- Node.js native http (no dependencies)
- Tests use Node.js built-in test runner