import { Container } from "@/components/container";
import { ScrollView, Text, View, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function CryptoPrices() {
  const topCryptocurrencies = [
    { 
      name: "Bitcoin", 
      symbol: "BTC", 
      icon: "₿",
      color: "#F7931A",
      description: "The first and largest cryptocurrency"
    },
    { 
      name: "Ethereum", 
      symbol: "ETH", 
      icon: "Ξ",
      color: "#627EEA", 
      description: "Smart contract platform"
    },
    { 
      name: "Solana", 
      symbol: "SOL", 
      icon: "◎",
      color: "#9945FF",
      description: "High-performance blockchain"
    },
    { 
      name: "Cardano", 
      symbol: "ADA", 
      icon: "₳",
      color: "#0033AD",
      description: "Research-driven blockchain"
    },
    { 
      name: "Ripple", 
      symbol: "XRP", 
      icon: "✕",
      color: "#23292F",
      description: "Digital payment protocol"
    },
    { 
      name: "Dogecoin", 
      symbol: "DOGE", 
      icon: "Ð",
      color: "#C2A633",
      description: "The meme cryptocurrency"
    },
    { 
      name: "Polkadot", 
      symbol: "DOT", 
      icon: "●",
      color: "#E6007A",
      description: "Multi-chain blockchain"
    },
    { 
      name: "Chainlink", 
      symbol: "LINK", 
      icon: "⬢",
      color: "#375BD2",
      description: "Decentralized oracle network"
    }
  ];

  const handleCryptoTap = (crypto: typeof topCryptocurrencies[0]) => {
    Alert.alert(
      `${crypto.name} (${crypto.symbol})`,
      `${crypto.description}\n\nSay: "Hey Siri, what's ${crypto.name} price?" to get current pricing information.`,
      [
        { text: "Got it!", style: "default" }
      ]
    );
  };

  return (
    <Container>
      <ScrollView className="flex-1 px-4">
        <View className="pt-4 pb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Cryptocurrency Prices
          </Text>
          <Text className="text-lg text-muted-foreground">
            Ask Siri for real-time prices on these popular cryptocurrencies
          </Text>
        </View>

        <View className="mb-6">
          <View className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
            <View className="flex-row items-center">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text className="text-blue-800 dark:text-blue-200 font-medium ml-2">
                Voice Commands
              </Text>
            </View>
            <Text className="text-blue-700 dark:text-blue-300 text-sm mt-2">
              Tap any cryptocurrency below to see how to ask Siri for its price
            </Text>
          </View>
        </View>

        <View className="space-y-3 pb-8">
          {topCryptocurrencies.map((crypto, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleCryptoTap(crypto)}
              className="bg-card border border-border rounded-xl p-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View 
                    className="w-12 h-12 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: crypto.color + '20' }}
                  >
                    <Text className="text-2xl" style={{ color: crypto.color }}>
                      {crypto.icon}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground text-lg font-semibold">
                      {crypto.name}
                    </Text>
                    <Text className="text-muted-foreground text-sm mb-1">
                      {crypto.symbol}
                    </Text>
                    <Text className="text-muted-foreground text-xs">
                      {crypto.description}
                    </Text>
                  </View>
                </View>
                <View className="items-center">
                  <Ionicons name="mic" size={20} color="#9CA3AF" />
                  <Text className="text-muted-foreground text-xs mt-1">
                    Ask Siri
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Container>
  );
}
