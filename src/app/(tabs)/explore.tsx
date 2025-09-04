import { Image } from "expo-image";
import { Platform, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { View } from "react-native-reanimated/lib/typescript/Animated";

export default function ExploreScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Explore screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});
