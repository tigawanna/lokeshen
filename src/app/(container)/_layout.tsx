import { Stack } from "expo-router";

// this grouped routes  (contaner) layout exists because tanstcak query provider is defined in the root layout making it hard to useQuery in that layout

export default function ContainerLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
