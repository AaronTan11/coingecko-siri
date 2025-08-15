# 🚀 CoinGecko Siri Integration

Ask Siri about crypto prices and get real-time data from CoinGecko - all in under 5 seconds! This project enables natural voice interactions with cryptocurrency data through iOS Siri integration.

**🌐 Just a landing page for you to look at:** [https://coingecko-siri-web.vercel.app/](https://coingecko-siri-web.vercel.app/)

## 🎥 Demo Video

<div style="position: relative; padding-bottom: 62.5%; height: 0;"><iframe src="https://www.loom.com/embed/cc91e96c7eba4e8a9e6786038bbe92de?sid=81f055b6-1839-420b-9501-0e12eb3f1588" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>

## ✨ What This Does

Simply ask Siri questions like:
- "Hey Siri, what's the price of Bitcoin?"
- "Hey Siri, how is Ethereum performing today?"
- "Hey Siri, what are the top gaining cryptocurrencies?"

And get instant, conversational responses powered by CoinGecko's professional API and Claude AI.

## 🏗️ Architecture

- **iOS App Intent** - Native iOS integration with Siri voice commands
- **API Server** - Hono-based backend that processes voice queries
- **MCP Integration** - Model Context Protocol connects to CoinGecko API
- **AI Processing** - Claude AI interprets natural language and formats responses
- **Voice Response** - Results spoken back through Siri in under 5 seconds

## 🛠️ Tech Stack

- **TypeScript** - Type-safe development across all components
- **iOS App Intents** - Native Siri integration and voice command handling
- **Hono** - Lightning-fast API server framework
- **Model Context Protocol (MCP)** - CoinGecko API integration
- **Claude AI** - Natural language processing and response generation
- **TanStack Router** - Type-safe routing for the web interface
- **TailwindCSS + shadcn/ui** - Modern, responsive UI components
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```


Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Use the Expo Go app to run the mobile application.
The API is running at [http://localhost:3000](http://localhost:3000).



## Project Structure

```
coingecko-siri/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   ├── native/      # Mobile application (React Native, Expo)
│   └── server/      # Backend API (Hono)
```

## 📱 How It Works

1. **Ask Siri** - Use natural language to ask about any cryptocurrency
2. **iOS App Intent** - Native iOS app captures the voice command
3. **API Processing** - Request sent to Hono server with Claude AI + CoinGecko MCP
4. **Real-time Data** - CoinGecko Pro API provides up-to-date market information
5. **Voice Response** - Siri speaks the result back to you in conversational format

## 🚀 Available Scripts

- `pnpm dev`: Start all applications in development mode
- `pnpm build`: Build all applications
- `pnpm dev:web`: Start only the web application
- `pnpm dev:server`: Start only the server
- `pnpm check-types`: Check TypeScript types across all apps
- `pnpm dev:native`: Start the React Native/Expo development server

## 🌟 Example Commands

Try asking Siri these questions:

- **Price Checks**: "What's the current price of Bitcoin?"
- **Market Trends**: "How is Ethereum performing today?"
- **Top Performers**: "What are the top gaining cryptocurrencies?"
- **Market Data**: "What's the market cap of Solana?"
- **General Info**: "Tell me about Chainlink"
- **Market Overview**: "How is the crypto market doing?"

## 🎯 Why I Built This

I built this project hoping that one day either the team from CoinGecko can implement this feature in their official app, or maybe I'll join their team to help make it happen! 😄 

The crypto community deserves seamless, voice-first access to market data, and this is my contribution to making that vision a reality.
