import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from "zod";
import { getMCPClient, cleanupMCPClient } from "./mcp-client.js";
import { getCoinGeckoMCPClient, cleanupCoinGeckoMCPClient } from "./mcp-remote-client.js";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "OPTIONS"],
  })
);

// Schema for the /siri endpoint
const siriRequestSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
});

app.get("/", (c) => {
  return c.text("CoinGecko Siri Server - Ready! Try /siri (local) or /siri-remote endpoints");
});

app.get("/test", async (c) => {
  try {
    const testQuery = "What is the current price of Bitcoin?";
    console.log("🧪 Testing both local and remote MCP connections...");
    
    const startLocal = Date.now();
    const mcpClient = await getMCPClient();
    const localResponse = await mcpClient.processQuery(testQuery);
    const localTime = Date.now() - startLocal;
    
    const startRemote = Date.now();
    const remoteMCPClient = await getCoinGeckoMCPClient();
    const remoteResponse = await remoteMCPClient.processQuery(testQuery);
    const remoteTime = Date.now() - startRemote;
    
    return c.json({
      success: true,
      query: testQuery,
      results: {
        local: {
          response: localResponse.substring(0, 200) + "...",
          time_ms: localTime
        },
        remote: {
          response: remoteResponse.substring(0, 200) + "...",
          time_ms: remoteTime
        }
      },
      performance: {
        faster: localTime < remoteTime ? "local" : "remote",
        difference_ms: Math.abs(localTime - remoteTime)
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error during test:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

app.post("/siri", async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate the request body
    const validationResult = siriRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json(
        {
          success: false,
          error: "Invalid request body",
          details: validationResult.error.issues,
          timestamp: new Date().toISOString(),
        },
        400
      );
    }
    
    const { query } = validationResult.data;
    
    console.log(`Processing Siri query: "${query}"`);
    
    const mcpClient = await getMCPClient();
    const response = await mcpClient.processQuery(query + "please make the response short and concise. if the answer is in a list, please rewrite them in paragraph format so siri can read it out loud.");
    
    return c.json({
      success: true,
      speech: response,
      query: query,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing Siri query:", error);
    
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

app.post("/siri-remote", async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate the request body
    const validationResult = siriRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json(
        {
          success: false,
          error: "Invalid request body",
          details: validationResult.error.issues,
          timestamp: new Date().toISOString(),
        },
        400
      );
    }
    
    const { query } = validationResult.data;
    
    console.log(`Processing Siri query via REMOTE MCP: "${query}"`);
    
    const remoteMCPClient = await getCoinGeckoMCPClient();
    const response = await remoteMCPClient.processQuery(query + "please make the response short and concise. if the answer is in a list, please rewrite them in paragraph format so siri can read it out loud.");
    
    return c.json({
      success: true,
      speech: response,
      query: query,
      mode: "remote-mcp",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing Siri query via remote MCP:", error);
    
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        mode: "remote-mcp",
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await Promise.all([
    cleanupMCPClient(),
    cleanupCoinGeckoMCPClient()
  ]);
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down server...");
  await Promise.all([
    cleanupMCPClient(),
    cleanupCoinGeckoMCPClient()
  ]);
  process.exit(0);
});

import { serve } from "@hono/node-server";

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
