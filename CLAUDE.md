# Claude Code 專案指南 — my-portal-mcp

## 首先閱讀

1. **PROJECT.md** - 技術棧、MCP Tools 清單、常用指令
2. **ARCHITECTURE.md** - 目錄結構、分層原則、命名規範、資料流
3. **MCP_PRD.md** - 產品需求規格（功能定義、資料模型、驗證規則）

## MCP Tools 快速索引

| Tool 名稱 | 模組 | 主要檔案 |
|-----------|------|---------|
| `create_invoice` | 發票 | `src/tools/invoiceTools.ts`, `src/apis/invoiceApi.ts`, `src/types/Invoice.ts` |

## 按需查看原則

- MCP Tool 邏輯 → `src/tools/xxxTools.ts`
- Firebase CRUD → `src/apis/xxxApi.ts`
- 型別定義 → `src/types/Xxx.ts`
- 伺服器進入點 → `src/index.ts`

## 新增功能模組標準流程

1. `src/types/ModuleName.ts` — 純型別定義（嚴禁 import 外部套件）
2. `src/apis/moduleNameApi.ts` — Firebase Admin SDK CRUD
3. `src/tools/moduleNameTools.ts` — MCP Tool 定義（Zod 驗證 + 呼叫 api 層）
4. `src/index.ts` — 註冊新 Tool

## 核心開發規範（必讀）

> **絕對禁止 `console.log`**
> stdout 由 MCP SDK 用於 JSON-RPC 通訊，任何 `console.log` 都會破壞協定導致 Server 崩潰。
> 所有 debug / 警告 / 錯誤訊息一律使用 `console.error`（輸出至 stderr）。

- **types 層**：嚴禁依賴任何外部套件（含 Firebase SDK）
- **apis 層**：所有 Firestore Timestamp 轉型在此處理，不得外漏至 tools 層
- **tools 層**：所有輸入參數必須經過 Zod 驗證，防呆邏輯（如重複資料檢查）在此執行


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **myportal-mcp** (341 symbols, 462 relationships, 10 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/myportal-mcp/context` | Codebase overview, check index freshness |
| `gitnexus://repo/myportal-mcp/clusters` | All functional areas |
| `gitnexus://repo/myportal-mcp/processes` | All execution flows |
| `gitnexus://repo/myportal-mcp/process/{name}` | Step-by-step execution trace |

## Cross-Repo Groups

This repository is listed under GitNexus **group(s): my-portal** (see `~/.gitnexus/groups/`). For cross-repo analysis, use MCP tools `impact`, `query`, and `context` with `repo` set to `@<groupName>` or `@<groupName>/<memberPath>` (paths match keys in that group’s `group.yaml`). Use `group_list` / `group_sync` for membership and sync. From the terminal: `npx gitnexus group list`, `npx gitnexus group sync <name>`, `npx gitnexus group impact <name> --target <symbol> --repo <group-path>`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
