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
  private endpointsMap: Map<string, any> = new Map(); // O(1) endpoint lookup
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private mcpServer: any;
  private coingeckoClient: Coingecko;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15000; // 15 seconds cache TTL for more stable crypto data

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
    
    // Create Coingecko client instance with keep-alive for better performance
    this.coingeckoClient = new Coingecko({
      environment: (COINGECKO_ENVIRONMENT as any) || undefined,
      defaultHeaders: { 
        'X-Stainless-MCP': 'true',
        'Connection': 'keep-alive' 
      },
    });
    
    // Start initialization immediately and keep promise for reuse
    this.initPromise = this.initializeServer();
  }

  private async initializeServer(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize the server with all endpoints
      init({ server, endpoints });
      
      // Cache tools list - convert endpoints to Anthropic tools format
      this.tools = endpoints.map((endpoint: any) => ({
        name: endpoint.tool.name,
        description: endpoint.tool.description,
        input_schema: endpoint.tool.inputSchema,
      }));

      // Pre-build endpoints map for O(1) lookups
      endpoints.forEach((endpoint: any) => {
        this.endpointsMap.set(endpoint.tool.name, endpoint);
      });

      this.mcpServer = server;
      
      console.log(
        `Initialized CoinGecko MCP with ${this.tools.length} tools:`,
        this.tools.map(({ name }) => name).slice(0, 5), // Show first 5 tools
        this.tools.length > 5 ? `... and ${this.tools.length - 5} more` : ""
      );

      // Warm up APIs in parallel for faster first requests
      await this.warmupAPIs();
      
      this.isInitialized = true;
    } catch (e) {
      console.error("Failed to initialize MCP server:", e);
      throw e;
    }
  }

  private async warmupAPIs(): Promise<void> {
    console.log("🔥 Warming up APIs for faster first requests...");
    
    const warmupPromises = [
      // Warm up Anthropic API with a minimal request
      this.anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }).catch(() => {}), // Ignore errors, this is just for warmup
      
      // Warm up CoinGecko API using the optimized MCP tool system
      (async () => {
        try {
          const simpleEndpoint = this.endpointsMap.get('mcp_coingecko_mcp_get_simple_price');
          if (simpleEndpoint) {
            await simpleEndpoint.handler(this.coingeckoClient, {
              ids: "bitcoin",
              vs_currencies: "usd",
            });
          }
        } catch (e) {
          // Ignore warmup errors
        }
      })(),
    ];

    await Promise.all(warmupPromises);
    console.log("✅ API warmup completed");
  }

  async processQuery(query: string): Promise<string> {
    const startTime = Date.now();
    console.log(`🚀 [${Date.now() - startTime}ms] Starting ultra-fast single-stream processQuery for: "${query}"`);

    // Ensure initialization is complete - reuse promise, don't null it
    if (this.initPromise) {
      console.log(`⏳ [${Date.now() - startTime}ms] Waiting for initialization...`);
      await this.initPromise;
      console.log(`✅ [${Date.now() - startTime}ms] Initialization complete`);
    }

    if (!this.isInitialized) {
      throw new Error("Failed to initialize MCP server");
    }

    // Enhanced query with more specific instructions for single-stream processing
    const enhancedQuery = `${query}

Please use the available cryptocurrency tools to get the data you need, then provide a complete, conversational response suitable for voice. Make your response short and concise, and if the answer involves a list, rewrite it in paragraph format so it can be read aloud naturally.`;

    // Use Anthropic's conversation-style streaming with tool support
    return this.processWithSingleStreamConversation(enhancedQuery, startTime);
  }

  private async processWithSingleStreamConversation(query: string, startTime: number): Promise<string> {
    const messages: MessageParam[] = [
      {
        role: "user",
        content: query,
      },
    ];

    console.log(`🧠 [${Date.now() - startTime}ms] Starting single continuous Claude conversation...`);

    let conversationComplete = false;
    let finalResponse = "";
    
    while (!conversationComplete) {
      // Start streaming from Claude
      const stream = await this.anthropic.messages.stream({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1000,
        messages,
        tools: this.tools,
      });

      // Process this round of the conversation
      const result = await this.processStreamRound(stream, startTime);
      
      if (result.toolUses.length > 0) {
        // Claude wants to use tools - execute them and continue conversation
        console.log(`🔧 [${Date.now() - startTime}ms] Executing ${result.toolUses.length} tools with streaming results...`);
        
        // Add Claude's tool requests to conversation
        messages.push({
          role: "assistant",
          content: result.toolUses.map(toolUse => ({
            type: "tool_use" as const,
            id: toolUse.id,
            name: toolUse.name,
            input: toolUse.input,
          })),
        });

        // Execute tools and stream results back as they complete
        const toolResults = await this.executeToolsWithStreamingResults(result.toolUses, startTime);
        
        // Add tool results to conversation
        messages.push({
          role: "user", 
          content: toolResults.map(result => ({
            type: "tool_result" as const,
            tool_use_id: result.id,
            content: result.content,
          })),
        });

        // Continue the conversation with tool results
        console.log(`🔄 [${Date.now() - startTime}ms] Continuing conversation with tool results...`);
      } else {
        // No tools needed - this is the final response
        finalResponse = result.textContent;
        conversationComplete = true;
        console.log(`✅ [${Date.now() - startTime}ms] Conversation complete - Total time: ${Date.now() - startTime}ms`);
      }
    }

    return finalResponse;
  }

  private async processStreamRound(stream: any, startTime: number): Promise<{
    toolUses: Array<{ id: string; name: string; input: any; }>;
    textContent: string;
  }> {
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
            console.log(`🎯 [${Date.now() - startTime}ms] Tool call detected: ${currentToolUse.name}`);
          } catch (e) {
            console.error("❌ Failed to parse tool input:", currentToolUse.input);
          }
          currentToolUse = null;
        }
      }
    }

    return {
      toolUses,
      textContent: textParts.join("").trim(),
    };
  }

  private async executeToolsWithStreamingResults(
    toolUses: Array<{ id: string; name: string; input: any; }>,
    startTime: number
  ): Promise<Array<{ id: string; content: string; success: boolean }>> {
    // Execute all tools in parallel and return results as they complete
    const toolPromises = toolUses.map(async (toolUse, index) => {
      console.log(`🚀 [${Date.now() - startTime}ms] Starting tool ${index + 1}/${toolUses.length}: ${toolUse.name}`);
      
      const result = await this.executeToolOptimized(toolUse, startTime);
      
      console.log(`✅ [${Date.now() - startTime}ms] Completed tool ${index + 1}/${toolUses.length}: ${toolUse.name} (${result.success ? 'success' : 'failed'})`);
      
      return result;
    });

    // Wait for all tools to complete but process them as they finish
    const results = await Promise.all(toolPromises);
    
    console.log(`🎯 [${Date.now() - startTime}ms] All ${toolUses.length} tools completed`);
    
    return results;
  }

  private async executeToolOptimized(toolUse: { id: string; name: string; input: any }, startTime: number): Promise<{ id: string; content: string; success: boolean }> {
    try {
      // Create cache key for this tool call
      const cacheKey = `${toolUse.name}:${JSON.stringify(toolUse.input)}`;
      
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`💾 [${Date.now() - startTime}ms] Tool ${toolUse.name} served from cache`);
        return {
          id: toolUse.id,
          content: JSON.stringify(cached.data),
          success: true,
        };
      }
      
      // O(1) endpoint lookup instead of array.find()
      const endpoint = this.endpointsMap.get(toolUse.name);
      if (!endpoint) {
        throw new Error(`Tool ${toolUse.name} not found`);
      }
      
      const result = await endpoint.handler(this.coingeckoClient, toolUse.input);
      
      // Cache the result with longer TTL for more stable crypto data
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return {
        id: toolUse.id,
        content: JSON.stringify(result),
        success: true,
      };
    } catch (error) {
      console.error(`❌ [${Date.now() - startTime}ms] Tool ${toolUse.name} failed:`, error);
      return {
        id: toolUse.id,
        content: `[Error: ${error}]`,
        success: false,
      };
    }
  }

  async cleanup(): Promise<void> {
    // Clear cache and endpoints map to prevent memory leaks
    this.cache.clear();
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