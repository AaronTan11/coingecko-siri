import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Container } from "@/components/container";

export default function Home() {
  
  const handleSiriSetup = () => {
    Alert.alert(
      "Setup Siri Shortcuts",
      "To use CoinGecko with Siri:\n\n1. Say 'Hey Siri, What's Bitcoin price'\n2. Or go to Settings > Siri & Search > CoinGecko\n3. Add shortcuts for quick access",
      [{ text: "Got it!", style: "default" }]
    );
  };

  const popularCryptos = [
    { name: "Bitcoin", symbol: "BTC", icon: "₿" },
    { name: "Ethereum", symbol: "ETH", icon: "Ξ" },
    { name: "Solana", symbol: "SOL", icon: "◎" },
    { name: "Cardano", symbol: "ADA", icon: "₳" },
  ];

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
        {/* Header */}
        <View className="pt-4 pb-6">
          <Text className="text-foreground text-3xl font-bold mb-2">
            CoinGecko Siri
          </Text>
          <Text className="text-muted-foreground text-base">
            Ask Siri about cryptocurrency prices and market data
          </Text>
        </View>

        {/* Siri Setup Card */}
        <TouchableOpacity
          onPress={handleSiriSetup}
          className="bg-card border border-border rounded-xl p-6 mb-6 shadow-sm"
        >
          <View className="flex-row items-center mb-3">
            <View className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 mr-4">
              <Ionicons name="mic" size={24} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-lg font-semibold">
                Setup Siri Shortcuts
              </Text>
              <Text className="text-muted-foreground text-sm">
                Enable voice commands for crypto data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
          <Text className="text-muted-foreground text-sm">
            Tap to learn how to set up Siri shortcuts for instant crypto updates
          </Text>
        </TouchableOpacity>

        {/* Quick Commands */}
        <View className="mb-6">
          <Text className="text-foreground text-xl font-semibold mb-4">
            Try These Commands
          </Text>
          
          <View className="space-y-3">
            {[
              "Hey Siri, what's Bitcoin price?",
              "Hey Siri, check Ethereum price",
              "Hey Siri, crypto market overview",
              "Hey Siri, what's trending in crypto?"
            ].map((command, index) => (
              <View key={index} className="bg-card border border-border rounded-lg p-4">
                <Text className="text-foreground font-medium mb-1">
                  "{command}"
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Voice command for Siri
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Popular Cryptocurrencies */}
        <View className="mb-6">
          <Text className="text-foreground text-xl font-semibold mb-4">
            Popular Cryptocurrencies
          </Text>
          
          <View className="flex-row flex-wrap justify-between">
            {popularCryptos.map((crypto, index) => (
              <View key={index} className="bg-card border border-border rounded-lg p-4 mb-3 w-[48%]">
                <View className="flex-row items-center mb-2">
                  <Text className="text-2xl mr-2">{crypto.icon}</Text>
                  <View>
                    <Text className="text-foreground font-semibold">
                      {crypto.name}
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                      {crypto.symbol}
                    </Text>
                  </View>
                </View>
                <Text className="text-muted-foreground text-xs">
                  Ask Siri for current price
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features */}
        <View className="mb-8">
          <Text className="text-foreground text-xl font-semibold mb-4">
            What You Can Ask
          </Text>
          
          <View className="space-y-3">
            {[
              { icon: "trending-up", title: "Price Checks", desc: "Get real-time prices for any cryptocurrency" },
              { icon: "analytics", title: "Market Analysis", desc: "Market cap, volume, and trend analysis" },
              { icon: "star", title: "Trending Coins", desc: "Discover what's hot in the crypto market" },
              { icon: "time", title: "24h Changes", desc: "Price movements and percentage changes" }
            ].map((feature, index) => (
              <View key={index} className="bg-card border border-border rounded-lg p-4 flex-row items-center">
                <View className="bg-primary/10 rounded-full p-2 mr-4">
                  <Ionicons name={feature.icon as any} size={20} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-medium mb-1">
                    {feature.title}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {feature.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
