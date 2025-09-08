import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GlobalSnackbar } from "@/lib/react-native-paper/snackbar/GlobalSnackbar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { useSettingsStore } from "@/store/settings-store";
import { useThemeSetup } from "@/hooks/theme/use-theme-setup";
import "react-native-reanimated";
import { focusManager, QueryClientProvider } from "@tanstack/react-query";
import { AppStateStatus, Platform } from "react-native";
import { useAppState, useOnlineManager } from "@/lib/tanstack/query/react-native-setup-hooks";
import { queryClient } from "@/lib/tanstack/query/client";
import { ExpoSpatialiteWrapper } from "@/lib/expo-spatialite/app-wrapper";

function onAppStateChange(status: AppStateStatus) {
  // React Query already supports in web browser refetch on window focus by default
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

export default function RootLayout() {
  useOnlineManager();
  useAppState(onAppStateChange);
  const { dynamicColors } = useSettingsStore();
  const { colorScheme, paperTheme } = useThemeSetup(dynamicColors);
  const [loaded] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <PaperProvider theme={paperTheme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          <ExpoSpatialiteWrapper>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="(container)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </ThemeProvider>
            </QueryClientProvider>
          </ExpoSpatialiteWrapper>
          <GlobalSnackbar />
        </GestureHandlerRootView>
      </PaperProvider>
    </ThemeProvider>
  );
}
