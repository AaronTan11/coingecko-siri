import "dotenv/config";
import { Anthropic } from "@anthropic-ai/sdk";
import type {
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { server, endpoints, init } from "@coingecko/coingecko-mcp/server";
import Coingecko from "@coingecko/coingecko-typescript";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const COINGECKO_ENVIRONMENT = process.env.COINGECKO_ENVIRONMENT;
const COINGECKO_PRO_API_KEY = process.env.COINGECKO_PRO_API_KEY;

if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

// Set up environment for CoinGecko
if (COINGECKO_PRO_API_KEY) {
  process.env.COINGECKO_PRO_API_KEY = COINGECKO_PRO_API_KEY;
}
if (COINGECKO_ENVIRONMENT) {
  process.env.COINGECKO_ENVIRONMENT = COINGECKO_ENVIRONMENT;
}

class MCPClient {
  private anthropic: Anthropic;
  private tools: Tool[] = [];
  private endpointsMap: Map<string, any> = new Map();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private coingeckoClient: Coingecko;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
    
    this.coingeckoClient = new Coingecko({
      environment: (COINGECKO_ENVIRONMENT as any) || undefined,
    });
    
    this.initPromise = this.initializeServer();
  }

  private async initializeServer(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      init({ server, endpoints });
      
      this.tools = endpoints.map((endpoint: any) => ({
        name: endpoint.tool.name,
        description: endpoint.tool.description,
        input_schema: endpoint.tool.inputSchema,
      }));

      endpoints.forEach((endpoint: any) => {
        this.endpointsMap.set(endpoint.tool.name, endpoint);
      });
      
      console.log(`✅ Initialized CoinGecko MCP with ${this.tools.length} tools`);
      this.isInitialized = true;
    } catch (e) {
      console.error("❌ Failed to initialize MCP server:", e);
      throw e;
    }
  }

  async processQuery(query: string): Promise<string> {
    console.log(`🚀 Processing query: "${query}"`);

    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }

    if (!this.isInitialized) {
      throw new Error("Failed to initialize MCP server");
    }

    const enhancedQuery = `${query}

Please use the available cryptocurrency tools to get the data you need, then provide a complete, conversational response suitable for voice. Make your response short and concise, and if the answer involves a list, rewrite it in paragraph format so it can be read aloud naturally.`;

    const messages: MessageParam[] = [
      {
        role: "user",
        content: enhancedQuery,
      },
    ];

    // First call to Claude with tools
    const response = await this.anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1000,
      messages,
      tools: this.tools,
    });

    // Check if Claude wants to use tools
    const toolUses = response.content.filter(content => content.type === 'tool_use');
    
    if (toolUses.length > 0) {
      console.log(`🔧 Executing ${toolUses.length} tools...`);
      
      // Execute tools in parallel
      const toolResults = await Promise.all(
        toolUses.map(async (toolUse: any) => {
          try {
            const endpoint = this.endpointsMap.get(toolUse.name);
            if (!endpoint) {
              throw new Error(`Tool ${toolUse.name} not found`);
            }
            
            const result = await endpoint.handler(this.coingeckoClient, toolUse.input);
            return {
              type: "tool_result" as const,
              tool_use_id: toolUse.id,
              content: JSON.stringify(result),
            };
          } catch (error) {
            return {
              type: "tool_result" as const,
              tool_use_id: toolUse.id,
              content: `[Error: ${error}]`,
            };
          }
        })
      );

      // Add assistant message with tool uses
      messages.push({
        role: "assistant",
        content: response.content,
      });

      // Add tool results
      messages.push({
        role: "user",
        content: toolResults,
      });

      // Get final response from Claude
      const finalResponse = await this.anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1000,
        messages,
      });

      const textContent = finalResponse.content
        .filter(content => content.type === 'text')
        .map((content: any) => content.text)
        .join('');

      console.log(`✅ Query completed with tools`);
      return textContent;
    }

    // No tools needed, return direct response
    const textContent = response.content
      .filter(content => content.type === 'text')
      .map((content: any) => content.text)
      .join('');

    console.log(`✅ Query completed without tools`);
    return textContent;
  }

  async cleanup(): Promise<void> {
    this.endpointsMap.clear();
    this.isInitialized = false;
  }
}

// Create a singleton instance
let mcpClientInstance: MCPClient | null = null;

export async function getMCPClient(): Promise<MCPClient> {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
    // Connection is started automatically in constructor, 
    // we just need to ensure it's ready before first use
  }
  return mcpClientInstance;
}

export async function cleanupMCPClient() {
  if (mcpClientInstance) {
    await mcpClientInstance.cleanup();
    mcpClientInstance = null;
  }
}