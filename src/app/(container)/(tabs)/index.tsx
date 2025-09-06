import { View } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: top, justifyContent: "center", alignItems: "center" }}>
      <Text variant="headlineMedium">Home screen</Text>
    </View>
  );
}
