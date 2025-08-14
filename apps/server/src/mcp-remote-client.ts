import "dotenv/config";
import { Anthropic } from "@anthropic-ai/sdk";
import type {
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const COINGECKO_PRO_API_KEY = process.env.COINGECKO_PRO_API_KEY;

if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

if (!COINGECKO_PRO_API_KEY) {
  throw new Error("COINGECKO_PRO_API_KEY is required for CoinGecko MCP connection");
}

class CoinGeckoMCPClient {
  private anthropic: Anthropic;
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
    this.client = new Client(
      { name: "coingecko-siri-client", version: "1.0.0" },
      { capabilities: {} }
    );
    
    // Start initialization immediately
    this.initPromise = this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log("🔗 Starting CoinGecko MCP server...");
      
      // Create stdio transport to connect to remote CoinGecko MCP server
      this.transport = new StdioClientTransport({
        command: "npx",
        args: ["mcp-remote",
        "https://mcp.pro-api.coingecko.com/sse"]
      });

      // Connect to the MCP server
      await this.client.connect(this.transport);
      console.log("✅ Connected to CoinGecko MCP server");

      // List available tools
      const toolsResult = await this.client.listTools();
      this.tools = toolsResult.tools.map((tool) => ({
        name: tool.name,
        description: tool.description || "",
        input_schema: tool.inputSchema,
      }));

      this.isInitialized = true;
      
      console.log(
        `✅ Initialized CoinGecko MCP with ${this.tools.length} tools:`,
        this.tools.map(({ name }) => name).slice(0, 5), // Show first 5 tools
        this.tools.length > 5 ? `... and ${this.tools.length - 5} more` : ""
      );
    } catch (error) {
      console.error("❌ Failed to connect to CoinGecko MCP server:", error);
      this.initPromise = null; // Reset promise so we can retry
      throw error;
    }
  }

  async processQuery(query: string): Promise<string> {
    const startTime = Date.now();
    console.log(`🚀 [${Date.now() - startTime}ms] Starting CoinGecko MCP processQuery for: "${query}"`);

    // Ensure initialization is complete
    if (this.initPromise) {
      console.log(`⏳ [${Date.now() - startTime}ms] Waiting for CoinGecko MCP connection...`);
      await this.initPromise;
      this.initPromise = null; // Clear promise after first use
      console.log(`✅ [${Date.now() - startTime}ms] CoinGecko MCP connection ready`);
    }

    if (!this.isInitialized) {
      throw new Error("Failed to initialize CoinGecko MCP connection");
    }

    // Enhanced query that instructs Claude to use tools AND provide final answer
    const enhancedQuery = `${query}

Please use the available cryptocurrency tools to get the data you need, then provide a complete, conversational response suitable for voice. Make your response short and concise, and if the answer involves a list, rewrite it in paragraph format so it can be read aloud naturally.`;

    const messages: MessageParam[] = [
      {
        role: "user",
        content: enhancedQuery,
      },
    ];

    console.log(`🧠 [${Date.now() - startTime}ms] Starting SINGLE streaming Claude call with CoinGecko MCP tools...`);
    const stream = await this.anthropic.messages.stream({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1000,
      messages,
      tools: this.tools,
    });

    // Collect streaming response
    const toolUses: Array<{ id: string; name: string; input: any; }> = [];
    const textParts: string[] = [];
    let currentToolUse: any = null;

    for await (const event of stream) {
      if (event.type === "content_block_start") {
        if (event.content_block.type === "tool_use") {
          currentToolUse = {
            id: event.content_block.id,
            name: event.content_block.name,
            input: "",
          };
        }
      } else if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          textParts.push(event.delta.text);
          process.stdout.write(event.delta.text); // Real-time output
        } else if (event.delta.type === "input_json_delta" && currentToolUse) {
          currentToolUse.input += event.delta.partial_json;
        }
      } else if (event.type === "content_block_stop") {
        if (currentToolUse) {
          try {
            currentToolUse.input = JSON.parse(currentToolUse.input);
            toolUses.push(currentToolUse);
          } catch (e) {
            console.error("❌ Failed to parse tool input:", currentToolUse.input);
          }
          currentToolUse = null;
        }
      }
    }

    console.log(`\n✅ [${Date.now() - startTime}ms] SINGLE Claude call completed`);

    // If Claude used tools, execute them via CoinGecko MCP and format response
    if (toolUses.length > 0) {
      console.log(`🔧 [${Date.now() - startTime}ms] Executing ${toolUses.length} CoinGecko MCP tools in parallel...`);
      
      // Execute all tools in parallel via CoinGecko MCP
      const toolResults = await Promise.all(
        toolUses.map(async (toolUse) => {
          try {
            const result = await this.client.callTool({
              name: toolUse.name,
              arguments: toolUse.input,
            });
            return {
              id: toolUse.id,
              content: Array.isArray(result.content) 
                ? result.content.map(c => c.type === 'text' ? c.text : JSON.stringify(c)).join('\n')
                : String(result.content),
              success: true,
            };
          } catch (error) {
            console.error(`❌ Error calling CoinGecko MCP tool ${toolUse.name}:`, error);
            return {
              id: toolUse.id,
              content: `[Error: ${error}]`,
              success: false,
            };
          }
        })
      );

      console.log(`✅ [${Date.now() - startTime}ms] All CoinGecko MCP tools executed`);

      // Add tool results to messages for Claude to see
      messages.push({
        role: "assistant",
        content: toolUses.map(toolUse => ({
          type: "tool_use" as const,
          id: toolUse.id,
          name: toolUse.name,
          input: toolUse.input,
        })),
      });

      messages.push({
        role: "user", 
        content: toolResults.map(result => ({
          type: "tool_result" as const,
          tool_use_id: result.id,
          content: result.content,
        })),
      });

      console.log(`🧠 [${Date.now() - startTime}ms] Streaming final response from Claude...`);
      const finalStream = await this.anthropic.messages.stream({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1000,
        messages,
      });

      const finalText: string[] = [];
      for await (const event of finalStream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          finalText.push(event.delta.text);
          process.stdout.write(event.delta.text); // Real-time output
        }
      }
      
      console.log(`\n✅ [${Date.now() - startTime}ms] COINGECKO MCP COMPLETE - Total time: ${Date.now() - startTime}ms`);
      return finalText.join("").trim();
    }

    // If no tools were used, return the direct response
    console.log(`🚀 [${Date.now() - startTime}ms] No CoinGecko MCP tools needed - direct response!`);
    return textParts.join("").trim();
  }

  async cleanup(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
    this.isInitialized = false;
  }
}

// Create a singleton instance
let coinGeckoMCPClientInstance: CoinGeckoMCPClient | null = null;

export async function getCoinGeckoMCPClient(): Promise<CoinGeckoMCPClient> {
  if (!coinGeckoMCPClientInstance) {
    coinGeckoMCPClientInstance = new CoinGeckoMCPClient();
    // Connection is started automatically in constructor, 
    // we just need to ensure it's ready before first use
  }
  return coinGeckoMCPClientInstance;
}

export async function cleanupCoinGeckoMCPClient() {
  if (coinGeckoMCPClientInstance) {
    await coinGeckoMCPClientInstance.cleanup();
    coinGeckoMCPClientInstance = null;
  }
}
