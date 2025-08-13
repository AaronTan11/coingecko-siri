import "dotenv/config";
import { Anthropic } from "@anthropic-ai/sdk";
import type {
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "https://mcp.pro-api.coingecko.com/sse";
const COINGECKO_ENVIRONMENT = process.env.COINGECKO_ENVIRONMENT;
const COINGECKO_PRO_API_KEY = process.env.COINGECKO_PRO_API_KEY;

if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

class MCPClient {
  private mcp: Client;
  private anthropic: Anthropic;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];
  private isConnected = false;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
    this.mcp = new Client({ name: "coingecko-siri-client", version: "1.0.0" });
  }

  async connectToServer() {
    if (this.isConnected) {
      return;
    }

    try {
      // Set up environment variables for the MCP server
      const env: Record<string, string> = {};
      if (COINGECKO_ENVIRONMENT) {
        env.COINGECKO_ENVIRONMENT = COINGECKO_ENVIRONMENT;
      }
      if (COINGECKO_PRO_API_KEY) {
        env.COINGECKO_PRO_API_KEY = COINGECKO_PRO_API_KEY;
      }

      this.transport = new StdioClientTransport({
        command: "npx",
        args: ["-y", "mcp-remote", MCP_SERVER_URL, "--header", "x-cg-pro-api-key: " + COINGECKO_PRO_API_KEY],
        env,
      });

      await this.mcp.connect(this.transport);

      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
        };
      });

      this.isConnected = true;
      console.log(
        "Connected to CoinGecko MCP server with tools:",
        this.tools.map(({ name }) => name)
      );
    } catch (e) {
      console.error("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  async processQuery(query: string): Promise<string> {
    if (!this.isConnected) {
      await this.connectToServer();
    }

    const messages: MessageParam[] = [
      {
        role: "user",
        content: query,
      },
    ];

    const response = await this.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages,
      tools: this.tools,
    });

    const finalText: string[] = [];

    for (const content of response.content) {
      if (content.type === "text") {
        finalText.push(content.text);
      } else if (content.type === "tool_use") {
        const toolName = content.name;
        const toolArgs = content.input as { [x: string]: unknown } | undefined;

        try {
          const result = await this.mcp.callTool({
            name: toolName,
            arguments: toolArgs,
          });

          messages.push({
            role: "assistant",
            content: [
              {
                type: "tool_use",
                id: content.id,
                name: toolName,
                input: toolArgs,
              },
            ],
          });

          messages.push({
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: content.id,
                content: JSON.stringify(result.content),
              },
            ],
          });

          const nextResponse = await this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages,
          });

          if (nextResponse.content[0]?.type === "text") {
            finalText.push(nextResponse.content[0].text);
          }
        } catch (error) {
          console.error(`Error calling tool ${toolName}:`, error);
          finalText.push(`[Error calling tool ${toolName}: ${error}]`);
        }
      }
    }

    return finalText.join("\n");
  }

  async cleanup() {
    if (this.isConnected) {
      await this.mcp.close();
      this.isConnected = false;
    }
  }
}

// Create a singleton instance
let mcpClientInstance: MCPClient | null = null;

export async function getMCPClient(): Promise<MCPClient> {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
    await mcpClientInstance.connectToServer();
  }
  return mcpClientInstance;
}

export async function cleanupMCPClient() {
  if (mcpClientInstance) {
    await mcpClientInstance.cleanup();
    mcpClientInstance = null;
  }
}
