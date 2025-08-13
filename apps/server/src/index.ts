import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from "zod";
import { getMCPClient, cleanupMCPClient } from "./mcp-client.js";

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
  return c.text("OK");
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

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await cleanupMCPClient();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down server...");
  await cleanupMCPClient();
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
