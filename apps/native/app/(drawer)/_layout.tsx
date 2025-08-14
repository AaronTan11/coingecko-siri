import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Drawer } from "expo-router/drawer";

import { HeaderButton } from "@/components/header-button";

const DrawerLayout = () => {
  return (
    <Drawer
      screenOptions={{
        drawerStyle: {
          backgroundColor: "hsl(0 0% 100%)",
        },
        headerStyle: {
          backgroundColor: "hsl(0 0% 100%)",
        },
        headerTintColor: "hsl(222.2 84% 4.9%)",
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          headerTitle: "CoinGecko Siri",
          drawerLabel: "Home",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerTitle: "Crypto Markets",
          drawerLabel: "Markets",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <HeaderButton />
            </Link>
          ),
        }}
      />
    </Drawer>
  );
};

export default DrawerLayout;
