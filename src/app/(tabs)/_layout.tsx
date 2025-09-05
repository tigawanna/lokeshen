import { HapticTab } from "@/components/default/HapticTab";
import { IconSymbol, MaterialIcon } from "@/components/default/ui/IconSymbol.ios";
import TabBarBackground from "@/components/default/ui/TabBarBackground";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useTheme } from "react-native-paper";

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomWidth: 0,
        },
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {
            backgroundColor: colors.surface,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          headerShown: true,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: true,
          tabBarIcon: ({ color }) => <MaterialIcon size={28} name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
