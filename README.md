# MCP Tools Registry

A comprehensive registry and management system for Model Context Protocol (MCP) tools. Automatically discovers, analyzes, and manages MCP tools across different platforms with intelligent path detection.

## 🚀 Features

- **Automatic Discovery**: Finds all MCP tools in your code directory
- **Cross-Platform**: Works on macOS, Windows, and Linux with platform-specific config paths
- **Smart Path Detection**: Reads package.json to determine correct entry points
- **Build Status Tracking**: Shows which tools are built, configured, and active
- **Config Generation**: Generates correct Claude config snippets
- **Build Management**: Install dependencies and build tools directly

## 🔧 Configuration

### Environment Variables

- **`CODE_PATH`** (optional): Path to your code directory containing MCP tools
  - Defaults to parent directory of this project
- **`CLAUDE_CONFIG_PATH`** (optional): Custom path to claude_desktop_config.json
  - Auto-detects platform-specific defaults:
    - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
    - **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
    - **Linux**: `~/.config/Claude/claude_desktop_config.json`

## 📋 Available Tools

Use `registry_summary()` to get current status, or `registry_list()` to see all tools:

```json
{
  "summary": {
    "total": 13,
    "active": 9,
    "broken": 0,
    "unconfigured": 4,
    "archived": 0
  }
}
```

### Tool Status Types

- **🟢 Active**: Built and configured in Claude - ready to use
- **🟡 Unconfigured**: Built but not added to Claude config yet
- **🔴 Broken**: Missing build files or dependencies
- **📦 Archived**: Moved to archived folder (not active)

## 🛠️ Usage

### List All Tools
```javascript
// List all tools
registry_list()

// Filter by status
registry_list({ status: "unconfigured" })
registry_list({ status: "active" })
```

### Get Tool Information
```javascript
// Get detailed info about a specific tool
registry_info({ tool: "tracked-search" })
registry_info({ tool: "mcp-brain-manager" })  // with or without mcp- prefix
```

### Generate Config Snippets
```javascript
// Generate Claude config for a tool
registry_config_snippet({ tool: "reminders" })
```

This generates the correct config with platform-appropriate paths:
```json
{
  "reminders": {
    "command": "node",
    "args": ["/Users/bard/Code/mcp-reminders/dist/index.js"]
  }
}
```

### Build Tools
```javascript
// Install dependencies and build a tool
registry_build({ tool: "smalledit" })
```

### Get Summary
```javascript
// Get overview of all tools
registry_summary()
```

## 📝 Claude Configuration

Add tools to your `claude_desktop_config.json`:

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
      "args": ["/Users/bard/Code/mcp-tracked-search/build/index.js"],
      "env": {
        "BRAVE_API_KEY": "your-api-key"
      }
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
## 📐 Common Patterns

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

## 🏗️ Development

### Building the Registry
```bash
npm install
npm run build
```

### Tool Discovery Rules

The registry looks for:
1. Directories starting with `mcp-` in your code path
2. Valid `package.json` files
3. Built entry points (reads `main` field from package.json)
4. Matching entries in Claude config

### Path Resolution

The registry intelligently handles different build structures:
- `dist/index.js` (most common)
- `build/index.js` (webpack projects)
- `lib/index.js` (some configs)
- `main.js` (custom entry points)
- `server.js` (custom names)

### Adding New Tools

1. **Create the tool**:
   ```bash
   mkdir mcp-my-tool
   cd mcp-my-tool
   npm init
   # Add MCP dependencies and implement
   ```

2. **Build the tool**:
   ```bash
   npm run build
   ```

3. **Check with registry**:
   ```javascript
   registry_info({ tool: "my-tool" })
   ```

4. **Generate config**:
   ```javascript
   registry_config_snippet({ tool: "my-tool" })
   ```

5. **Add to Claude config** and restart Claude

## 🔍 Troubleshooting

### Tool Shows as "Broken"
- Check if `npm run build` completes successfully
- Verify the `main` field in package.json points to correct file
- Ensure all dependencies are installed

### Tool Shows as "Unconfigured"
- Generate config with `registry_config_snippet()`
- Add the generated config to your claude_desktop_config.json
- Restart Claude Desktop

### Config Not Found
- Verify Claude Desktop is installed
- Check if config file exists at the expected platform path
- Use `CLAUDE_CONFIG_PATH` environment variable for custom locations

### 📊 Example Output

```json
{
  "name": "mcp-tracked-search",
  "path": "/Users/bard/Code/mcp-tracked-search",
  "configured": true,
  "status": "active",
  "description": "Drop-in replacement for web_search with automatic usage tracking",
  "version": "0.1.0",
  "tools": [
    "web_search",
    "tracked_search", 
    "search_usage"
  ]
}
```

## 🚀 Recent Updates

### v1.1.0
- ✅ **Cross-platform support** - Works on macOS, Windows, and Linux
- ✅ **Smart path detection** - Uses `os.homedir()` and platform-specific paths
- ✅ **Dynamic build paths** - Reads package.json main field instead of hardcoded paths
- ✅ **Robust config detection** - Finds Claude config automatically on all platforms

---

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

- **Total MCP Tools**: 13
- **Active/Maintained**: 9
- **Languages**: TypeScript (all)
- **Most Used**: brain-manager, tracked-search

## 🔮 Future Ideas

- `mcp-git-assistant` - Advanced git operations
- `mcp-database-query` - Direct database access
- `mcp-api-tester` - API testing and debugging
- `mcp-file-analyzer` - Advanced file analysis
- `mcp-code-reviewer` - Automated code review

---
**Last updated**: 2025-08-11  
**Platform support**: macOS, Windows, Linux  
**Node.js**: 16+ required
