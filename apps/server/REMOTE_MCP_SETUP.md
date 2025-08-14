# Remote MCP Setup Guide

This document explains how to use the remote MCP connection to CoinGecko's hosted server instead of running the MCP server locally.

## Overview

The remote MCP setup connects directly to CoinGecko's hosted MCP server at `https://mcp.pro-api.coingecko.com/sse` using Server-Sent Events (SSE) transport. This can potentially offer better performance and reliability compared to running the MCP server locally.

## Key Differences

### Local MCP (existing)
- Uses `@coingecko/coingecko-mcp` package
- Runs MCP server in-process
- Direct function calls to endpoints
- Available at `/siri` endpoint

### Remote MCP (new)
- Uses `@modelcontextprotocol/sdk` SSE transport
- Connects to CoinGecko's hosted server
- Network requests for tool execution
- Available at `/siri-remote` endpoint

## Environment Variables

Make sure you have these environment variables set:

```bash
# Required for both local and remote
ANTHROPIC_API_KEY=your_anthropic_api_key

# Required for remote MCP (your CoinGecko Pro API key)
COINGECKO_PRO_API_KEY=your_coingecko_pro_api_key

# Optional: For local MCP
COINGECKO_ENVIRONMENT=pro
```

## API Endpoints

### `/siri` (Local MCP)
- Uses the existing local MCP implementation
- Processes queries using local CoinGecko MCP server

### `/siri-remote` (Remote MCP)
- Uses the new remote MCP connection
- Processes queries using CoinGecko's hosted MCP server
- Response includes `"mode": "remote-mcp"` in the JSON

### `/test` (Performance Comparison)
- Tests both local and remote implementations
- Returns performance comparison data
- Useful for benchmarking

## Usage Examples

### Test the remote connection:
```bash
curl -X POST http://localhost:3000/siri-remote \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the current price of Bitcoin?"}'
```

### Compare performance:
```bash
curl http://localhost:3000/test
```

### Use existing local implementation:
```bash
curl -X POST http://localhost:3000/siri \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the current price of Bitcoin?"}'
```

## Performance Testing

The `/test` endpoint runs the same query against both local and remote implementations and returns:

- Response times for each method
- Performance comparison
- Sample responses

Example response:
```json
{
  "success": true,
  "query": "What is the current price of Bitcoin?",
  "results": {
    "local": {
      "response": "Bitcoin is currently trading at...",
      "time_ms": 1234
    },
    "remote": {
      "response": "Bitcoin is currently trading at...", 
      "time_ms": 987
    }
  },
  "performance": {
    "faster": "remote",
    "difference_ms": 247
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Implementation Details

### Remote Client (`mcp-remote-client.ts`)
- Uses SSE transport for real-time connection
- Singleton pattern for connection reuse
- Parallel tool execution
- Proper error handling and cleanup

### Local Client (`mcp-client.ts`)
- Uses direct function imports
- In-process MCP server
- Parallel tool execution
- Proper error handling and cleanup

## Troubleshooting

### Common Issues

1. **"COINGECKO_PRO_API_KEY is required"**
   - Make sure you have a valid CoinGecko Pro API key
   - Set the `COINGECKO_PRO_API_KEY` environment variable

2. **Connection timeout to remote server**
   - Check your internet connection
   - Verify the CoinGecko remote server is accessible
   - Ensure your API key is valid

3. **SSE connection errors**
   - Remote server may be temporarily unavailable
   - Try the local implementation as fallback

### Performance Considerations

- **Remote MCP**: May have higher latency due to network requests, but benefits from CoinGecko's infrastructure
- **Local MCP**: Lower latency for tool execution, but uses local resources

The best choice depends on your specific use case and network conditions. Use the `/test` endpoint to compare performance in your environment.

## Migration

To switch from local to remote:
1. Set the `COINGECKO_PRO_API_KEY` environment variable
2. Update your client to use `/siri-remote` instead of `/siri`
3. Test performance using `/test` endpoint

The local implementation remains fully functional as a fallback option.
