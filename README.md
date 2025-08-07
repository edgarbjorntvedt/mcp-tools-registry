# MCP Tools Registry

A central registry of all MCP tools with configurable code directory.

## Configuration

The registry uses the `CODE_PATH` environment variable to determine where to look for MCP tools. If not set, it defaults to the parent directory of where this tool is installed.

**Environment Variables:**
- `CODE_PATH` (optional): Path to your code directory. Defaults to parent directory of this project.

## 📋 Active MCP Tools

### 1. **mcp-brain-manager**
Brain management tools for MCP - handles project context, state management, and semantic routing.
- **Location**: `/Users/bard/Code/mcp-brain-manager`
- **Features**: Project switching, context tracking, workflow automation
- **Key Commands**: `update repo`, `create project`, `switch project`

### 2. **mcp-tracked-search**
Web search with automatic usage tracking.
- **Location**: `/Users/bard/Code/mcp-tracked-search`
- **Features**: Tracks search usage, supports multiple search APIs
- **Drop-in replacement** for built-in web_search

### 3. **mcp-project-finder**
Find and navigate projects in the Code directory.
- **Location**: `/Users/bard/Code/mcp-project-finder`
- **Features**: Fuzzy search, project info, recent projects
- **Key Tools**: `list_projects`, `find_project`, `project_info`

### 4. **mcp-smalledit**
Small file edits using sed and stream editors.
- **Location**: `/Users/bard/Code/mcp-smalledit`
- **Features**: Targeted edits, multi-file operations, preview mode, backup/restore
- **Key Tools**: `sed_edit`, `quick_replace`, `line_edit`, `restore_backup`, `list_backups`
- **IMPORTANT FOR CLAUDE**: Has a `help` tool! Use `smalledit:help({ tool: 'all' })` to see:
  - When to use smalledit vs filesystem tools
  - Common errors and solutions
  - Better alternatives for specific tasks
  - Complete workflow examples

### 5. **mcp-tarot-tool** 
Tarot card readings and interpretations.
- **Location**: `/Users/bard/Code/mcp-tarot-tool`
- **Features**: Various spreads, detailed interpretations
- **Status**: Demonstration/fun tool

### 6. **mcp-search-tracker**
(Appears to be an earlier version of tracked-search)
- **Location**: `/Users/bard/Code/mcp-search-tracker`
- **Status**: Possibly deprecated in favor of mcp-tracked-search

## 🚀 How to Add a New Tool

1. Create project: `create project mcp-[toolname]`
2. Implement MCP server with your tools
3. Add to this registry
4. Configure in Claude's MCP settings

## 📝 MCP Configuration

Add tools to your Claude configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "tools-registry": {
      "command": "node",
      "args": ["/Users/bard/Code/mcp-tools-registry/dist/index.js"],
      "env": {
        "CODE_PATH": "/Users/bard/Code"
      }
    },
    "brain-manager": {
      "command": "node",
      "args": ["/Users/bard/Code/mcp-brain-manager/dist/index.js"]
    },
    "tracked-search": {
      "command": "node", 
      "args": ["/Users/bard/Code/mcp-tracked-search/dist/index.js"]
    },
    "project-finder": {
      "command": "node",
      "args": ["/Users/bard/Code/mcp-project-finder/dist/index.js"]
    },
    "smalledit": {
      "command": "node",
      "args": ["/Users/bard/Code/mcp-smalledit/dist/index.js"]
    }
  }
}
```

**Example configurations:**

```json
// Use default (parent directory)
{
  "tools-registry": {
    "command": "node",
    "args": ["/Users/bard/Code/mcp-tools-registry/dist/index.js"],
    "env": {}
  }
}

// Custom code path
{
  "tools-registry": {
    "command": "node",
    "args": ["/Users/bard/Code/mcp-tools-registry/dist/index.js"],
    "env": {
      "CODE_PATH": "/Users/bard/Projects"
    }
  }
}
```

## 🏗️ Common Patterns

### Tool Naming
- Prefix: `mcp-`
- Descriptive name: what it does
- Examples: `mcp-file-manager`, `mcp-git-helper`

### Standard Structure
```
mcp-[toolname]/
├── src/
│   └── index.ts        # Main server file
├── dist/               # Compiled output
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
└── README.md          # Documentation
```

### Common Dependencies
- `@modelcontextprotocol/sdk` - MCP SDK
- `typescript` - For development
- Tool-specific deps (e.g., database drivers, API clients)

## 🔧 Development Tips

1. **Test locally** before adding to Claude config
2. **Use TypeScript** for better type safety
3. **Handle errors gracefully** - return clear error messages
4. **Document tools well** - include examples
5. **Version properly** - use semantic versioning

## 📊 Statistics

- **Total MCP Tools**: 6
- **Active/Maintained**: 4
- **Languages**: TypeScript (all)
- **Most Used**: brain-manager, tracked-search

## 🔮 Future Ideas

- `mcp-git-assistant` - Advanced git operations
- `mcp-database-query` - Direct database access
- `mcp-api-tester` - API testing and debugging
- `mcp-file-analyzer` - Advanced file analysis
- `mcp-code-reviewer` - Automated code review

---
*Last updated: 2025-07-10*
