# Claude's MCP Tool Best Practices

## 🤖 This Document is FOR CLAUDE

This document contains patterns and practices that Claude should follow when using MCP tools.

## 🛠️ General Principles

### 1. **Check for Help Tools First**
When using any MCP tool, check if it has a help tool:
```javascript
// Try this first with any new tool
toolname:help({ tool: 'all' })
```

### 2. **Create Systems, Not One-Off Fixes**
When you encounter a problem:
- ❌ Don't just fix the immediate issue
- ✅ Create tools/documentation to prevent future occurrences
- ✅ Update this document with lessons learned

### 3. **Right Tool for the Job**
Common tool selection mistakes:
- Using smalledit for complex multi-line edits → Use filesystem:edit_file
- Using filesystem for simple replacements → Use smalledit
- Manual file operations → Check if there's an MCP tool first

## 📋 Tool-Specific Guidelines

### smalledit
**When to use:**
- Single line changes
- Pattern replacements
- Version bumps
- Removing debug statements

**When NOT to use:**
- Multi-line code blocks
- JSON/YAML structure changes
- Adding functions/classes

**Always:**
1. Use `diff_preview` first
2. Create backups (default)
3. Use `restore_backup` if something goes wrong

### brain-manager
**Always start sessions with:**
```javascript
brain:brain_init()
```

**For project work:**
1. Check current project: `brain-manager:get_context_summary()`
2. Switch if needed: `brain-manager:switch_project()`
3. Use `update repo` workflow for commits

### filesystem
**Best practices:**
- Use `read_file` with `head`/`tail` for large files
- Always use `dryRun: true` first for complex edits
- Create directories before writing files

## 🚨 Common Pitfalls

### 1. **Shell Command Quoting**
- Problem: Special characters break commands
- Solution: Use filesystem tools for complex content

### 2. **Platform Differences**
- Problem: macOS sed vs Linux sed
- Solution: smalledit uses perl internally (cross-platform)

### 3. **Token Efficiency**
- Problem: Rewriting entire files for small changes
- Solution: Use smalledit for targeted edits

## 🔍 Debugging Patterns

### When an MCP tool fails:
1. Check if it has a help tool
2. Try with simpler input
3. Check error patterns in this doc
4. Consider creating a helper tool

### When you don't know which tool to use:
1. Check mcp-tools-registry
2. Look for help tools
3. Start with simplest approach

## 📝 Documentation Standards

### When creating new MCP tools:
1. **Always include a help tool**
2. Document common errors in help
3. Provide clear examples
4. Show when NOT to use the tool

### When documenting for future Claude:
- Put it in mcp-tools-registry
- Update this best practices doc
- Consider adding to brain memory

## 🎯 Meta-Principle

**If you find yourself explaining something to the user about how to use tools better, you should instead:**
1. Update the tool to be more self-documenting
2. Add the insight to this document
3. Create a help tool if missing
4. Make the tool more foolproof

Remember: The user shouldn't have to tell you about best practices - you should discover and document them yourself!

---
*Last updated: 2025-07-10*
*Purpose: Help Claude use MCP tools more effectively*
