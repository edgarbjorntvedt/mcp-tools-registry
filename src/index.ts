#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { promises as fs } from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface McpTool {
  name: string;
  path: string;
  description?: string;
  version?: string;
  configured: boolean;
  status: "active" | "broken" | "unconfigured" | "archived";
  tools?: string[];
  lastModified?: string;
  error?: string;
}

class McpToolsRegistry {
  private baseDir = "/Users/bard/Code";
  private configPath = path.join(
    process.env.HOME || "",
    "Library/Application Support/Claude/claude_desktop_config.json"
  );

  async discoverTools(): Promise<McpTool[]> {
    const tools: McpTool[] = [];
    
    try {
      const entries = await fs.readdir(this.baseDir, { withFileTypes: true });
      const mcpDirs = entries
        .filter(entry => entry.isDirectory() && entry.name.startsWith("mcp-"))
        .map(entry => entry.name);

      // Load Claude config to check which tools are configured
      const configuredTools = await this.getConfiguredTools();

      for (const dir of mcpDirs) {
        const toolPath = path.join(this.baseDir, dir);
        const tool = await this.analyzeToolDirectory(toolPath, configuredTools);
        if (tool) {
          tools.push(tool);
        }
      }

      // Check archived tools
      const archivedPath = path.join(this.baseDir, "archived");
      try {
        const archivedEntries = await fs.readdir(archivedPath, { withFileTypes: true });
        for (const entry of archivedEntries) {
          if (entry.isDirectory() && entry.name.startsWith("mcp-")) {
            const toolPath = path.join(archivedPath, entry.name);
            const tool = await this.analyzeToolDirectory(toolPath, configuredTools);
            if (tool) {
              tool.status = "archived";
              tools.push(tool);
            }
          }
        }
      } catch (error) {
        // Archived directory might not exist
      }

    } catch (error) {
      console.error("Error discovering tools:", error);
    }

    return tools;
  }

  private async getConfiguredTools(): Promise<Set<string>> {
    try {
      const configData = await fs.readFile(this.configPath, "utf-8");
      const config = JSON.parse(configData);
      return new Set(Object.keys(config.mcpServers || {}));
    } catch (error) {
      return new Set();
    }
  }

  private async analyzeToolDirectory(
    toolPath: string,
    configuredTools: Set<string>
  ): Promise<McpTool | null> {
    const name = path.basename(toolPath);
    const shortName = name.replace("mcp-", "");

    try {
      const stats = await fs.stat(toolPath);
      const tool: McpTool = {
        name,
        path: toolPath,
        configured: configuredTools.has(shortName),
        status: "unconfigured",
        lastModified: stats.mtime.toISOString(),
      };

      // Check if archived
      if (toolPath.includes("/archived/")) {
        tool.status = "archived";
        return tool;
      }

      // Try to read package.json
      try {
        const packageJsonPath = path.join(toolPath, "package.json");
        const packageData = await fs.readFile(packageJsonPath, "utf-8");
        const packageJson = JSON.parse(packageData);
        tool.description = packageJson.description;
        tool.version = packageJson.version;
      } catch (error) {
        // No package.json or invalid
        tool.status = "broken";
        tool.error = "Missing or invalid package.json";
        return tool;
      }

      // Check if built - use actual main entry point from package.json
      try {
        const packageJsonPath = path.join(toolPath, "package.json");
        const packageData = await fs.readFile(packageJsonPath, "utf-8");
        const packageJson = JSON.parse(packageData);
        const mainEntry = packageJson.main || "index.js";
        const entryPath = path.join(toolPath, mainEntry);
        
        await fs.access(entryPath);
        if (tool.configured) {
          tool.status = "active";
        } else {
          tool.status = "unconfigured";
        }
      } catch (error) {
        if (tool.configured) {
          tool.status = "broken";
          // Get main entry for error message
          try {
            const packageJsonPath = path.join(toolPath, "package.json");
            const packageData = await fs.readFile(packageJsonPath, "utf-8");
            const packageJson = JSON.parse(packageData);
            tool.error = `Not built (missing ${packageJson.main || "index.js"})`;
          } catch {
            tool.error = "Not built (missing entry point)";
          }
        }
      }

      // Try to get tool list (if active)
      if (tool.status === "active") {
        tool.tools = await this.getToolList(toolPath);
      }

      return tool;
    } catch (error) {
      return null;
    }
  }

  private async getToolList(toolPath: string): Promise<string[]> {
    // This is a simplified approach - in reality, we'd need to run the tool
    // or parse its source to get the actual tool list
    try {
      const srcPath = path.join(toolPath, "src", "index.ts");
      const content = await fs.readFile(srcPath, "utf-8");
      
      // Look for tool definitions
      const toolMatches = content.matchAll(/name:\s*["']([^"']+)["']/g);
      const tools: string[] = [];
      
      for (const match of toolMatches) {
        if (match[1] && !match[1].includes("mcp-")) {
          tools.push(match[1]);
        }
      }
      
      return tools;
    } catch (error) {
      return [];
    }
  }

  async getToolInfo(toolName: string): Promise<McpTool | null> {
    const tools = await this.discoverTools();
    return tools.find(t => t.name === toolName || t.name === `mcp-${toolName}`) || null;
  }

  async generateConfigSnippet(toolName: string): Promise<string> {
    const tool = await this.getToolInfo(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    const shortName = tool.name.replace("mcp-", "");
    const config = {
      [shortName]: {
        command: "node",
        args: [path.join(tool.path, "dist", "index.js")],
      },
    };

    return JSON.stringify(config, null, 2);
  }

  async buildTool(toolName: string): Promise<string> {
    const tool = await this.getToolInfo(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    try {
      // Install dependencies
      execSync("npm install", { cwd: tool.path });
      
      // Build
      execSync("npm run build", { cwd: tool.path });
      
      return "Successfully built " + tool.name;
    } catch (error: any) {
      throw new Error(`Failed to build ${tool.name}: ${error.message}`);
    }
  }
}

// Create server instance
const server = new Server(
  {
    name: "mcp-tools-registry",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const registry = new McpToolsRegistry();

// Define available tools
const TOOLS = [
  {
    name: "registry_list",
    description: "List all MCP tools in the system",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["all", "active", "broken", "unconfigured", "archived"],
          description: "Filter by tool status (default: all)",
        },
      },
    },
  },
  {
    name: "registry_info",
    description: "Get detailed information about a specific MCP tool",
    inputSchema: {
      type: "object",
      properties: {
        tool: {
          type: "string",
          description: "Tool name (with or without mcp- prefix)",
        },
      },
      required: ["tool"],
    },
  },
  {
    name: "registry_config_snippet",
    description: "Generate Claude config snippet for a tool",
    inputSchema: {
      type: "object",
      properties: {
        tool: {
          type: "string",
          description: "Tool name to generate config for",
        },
      },
      required: ["tool"],
    },
  },
  {
    name: "registry_build",
    description: "Build an MCP tool (npm install && npm run build)",
    inputSchema: {
      type: "object",
      properties: {
        tool: {
          type: "string",
          description: "Tool name to build",
        },
      },
      required: ["tool"],
    },
  },
  {
    name: "registry_summary",
    description: "Get a summary of MCP tools status",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "registry_help",
    description: "Get help on using the registry",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "registry_list": {
        const status = args?.status || "all";
        const tools = await registry.discoverTools();
        
        const filtered = status === "all" 
          ? tools 
          : tools.filter(t => t.status === status);
        
        const result = filtered
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(t => ({
            name: t.name,
            status: t.status,
            configured: t.configured,
            description: t.description,
            version: t.version,
            tools: t.tools?.length || 0,
            error: t.error,
          }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "registry_info": {
        const tool = await registry.getToolInfo(args.tool);
        
        if (!tool) {
          throw new Error(`Tool ${args.tool} not found`);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(tool, null, 2),
            },
          ],
        };
      }

      case "registry_config_snippet": {
        const snippet = await registry.generateConfigSnippet(args.tool);
        
        return {
          content: [
            {
              type: "text",
              text: `Add this to your claude_desktop_config.json under "mcpServers":\n\n${snippet}`,
            },
          ],
        };
      }

      case "registry_build": {
        const result = await registry.buildTool(args.tool);
        
        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      }

      case "registry_summary": {
        const tools = await registry.discoverTools();
        
        const summary = {
          total: tools.length,
          active: tools.filter(t => t.status === "active").length,
          broken: tools.filter(t => t.status === "broken").length,
          unconfigured: tools.filter(t => t.status === "unconfigured").length,
          archived: tools.filter(t => t.status === "archived").length,
          configured: tools.filter(t => t.configured).length,
        };

        const details = {
          active: tools.filter(t => t.status === "active").map(t => t.name),
          broken: tools.filter(t => t.status === "broken").map(t => ({
            name: t.name,
            error: t.error,
          })),
          unconfigured: tools.filter(t => t.status === "unconfigured").map(t => t.name),
          archived: tools.filter(t => t.status === "archived").map(t => t.name),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ summary, details }, null, 2),
            },
          ],
        };
      }

      case "registry_help": {
        const help = `MCP Tools Registry - Help

This tool helps discover, manage, and configure MCP tools.

Available commands:

1. registry_list - List all MCP tools
   Options:
   - status: "all" | "active" | "broken" | "unconfigured" | "archived"
   
2. registry_info - Get detailed info about a specific tool
   - tool: Tool name (e.g., "brain-manager" or "mcp-brain-manager")
   
3. registry_config_snippet - Generate config for claude_desktop_config.json
   - tool: Tool name to generate config for
   
4. registry_build - Build a tool (npm install && npm run build)
   - tool: Tool name to build
   
5. registry_summary - Get summary statistics

Tool statuses:
- active: Built and configured in Claude
- unconfigured: Built but not in Claude config
- broken: Missing files or not built
- archived: Moved to archived folder

Example workflow:
1. List all tools: registry_list()
2. Find unconfigured: registry_list({ status: "unconfigured" })
3. Get config: registry_config_snippet({ tool: "reminders" })
4. Build if needed: registry_build({ tool: "reminders" })`;

        return {
          content: [
            {
              type: "text",
              text: help,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Tools Registry running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
