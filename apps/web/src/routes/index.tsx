import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/');
      setApiStatus(response.ok ? 'online' : 'offline');
    } catch {
      setApiStatus('offline');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Ask Siri About{" "}
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Crypto
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Get real-time cryptocurrency data from CoinGecko using just your voice. 
              Ask Siri about Bitcoin prices, market trends, and more - all in under 5 seconds.
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="w-full sm:w-auto" disabled>
              🍎 iOS App (Coming Soon)
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={() => window.open('https://github.com/AaronTan11/coingecko-siri', '_blank')}
            >
              📖 View on GitHub
            </Button>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className={`h-3 w-3 rounded-full ${
              apiStatus === 'online' ? 'bg-green-500' : 
              apiStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
            }`} />
            <span className="text-sm text-muted-foreground">
              API Status: {apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold">See It In Action</h2>
          <div className="mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-xl border bg-card shadow-lg">
              <div style={{position: 'relative', paddingBottom: '62.5%', height: 0}}>
                <iframe 
                  src="https://www.loom.com/embed/cc91e96c7eba4e8a9e6786038bbe92de?sid=81f055b6-1839-420b-9501-0e12eb3f1588" 
                  frameBorder="0" 
                  allowFullScreen
                  style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold">Try These Commands</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {demoCommands.map((command, index) => (
              <Card key={index} className="transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-2xl">{command.icon}</span>
                    {command.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground">{command.description}</p>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm font-mono">"{command.example}"</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">
                  {step.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Features</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">{feature.icon}</span>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>Powered by CoinGecko API • Built with Claude AI • Made for iOS</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const demoCommands = [
  {
    icon: "💰",
    title: "Price Check",
    description: "Get current cryptocurrency prices",
    example: "Hey Siri, what's the price of Bitcoin?"
  },
  {
    icon: "📈",
    title: "Market Trends",
    description: "Check market performance and changes",
    example: "Hey Siri, how is Ethereum performing today?"
  },
  {
    icon: "🚀",
    title: "Top Gainers",
    description: "Find the biggest winners in crypto",
    example: "Hey Siri, what are the top gaining cryptocurrencies?"
  },
  {
    icon: "📊",
    title: "Market Cap",
    description: "Get market capitalization data",
    example: "Hey Siri, what's the market cap of Solana?"
  },
  {
    icon: "💎",
    title: "Altcoins",
    description: "Information about any cryptocurrency",
    example: "Hey Siri, tell me about Chainlink"
  },
  {
    icon: "🌍",
    title: "Global Market",
    description: "Overall crypto market statistics",
    example: "Hey Siri, how is the crypto market doing?"
  }
];

const steps = [
  {
    icon: "🗣️",
    title: "Speak to Siri",
    description: "Use natural language to ask about any cryptocurrency data"
  },
  {
    icon: "⚡",
    title: "AI Processing",
    description: "Claude AI processes your request and fetches real-time data from CoinGecko"
  },
  {
    icon: "🔊",
    title: "Voice Response",
    description: "Get your answer spoken back to you in under 5 seconds"
  }
];

const features = [
  {
    icon: "⚡",
    title: "Lightning Fast",
    description: "Get responses in under 5 seconds with real-time data processing"
  },
  {
    icon: "🔄",
    title: "Real-Time Data",
    description: "Always up-to-date information directly from CoinGecko's professional API"
  },
  {
    icon: "🧠",
    title: "AI-Powered",
    description: "Claude AI understands natural language and provides conversational responses"
  },
  {
    icon: "📱",
    title: "Native iOS",
    description: "Seamlessly integrated with Siri and iOS App Intents"
  },
  {
    icon: "🔒",
    title: "Privacy First",
    description: "Your voice commands are processed securely without storing personal data"
  },
  {
    icon: "🌐",
    title: "Comprehensive",
    description: "Access to thousands of cryptocurrencies and market data points"
  }
];
