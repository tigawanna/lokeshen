import { Image } from "expo-image";
import { Platform, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: top + 12 }}>
      <Text>Home screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
