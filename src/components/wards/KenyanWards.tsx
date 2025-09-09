import { StyleSheet } from "react-native";
import { Text, Surface, Button } from "react-native-paper";
import { useQuery } from "@tanstack/react-query";
import { useExpoSpatialiteContext } from "@/lib/expo-spatialite/ExpoSpatialiteProvider";

export function KenyanWards() {
  const { executeQuery } = useExpoSpatialiteContext();
  const { data, isPending, refetch,isRefetching } = useQuery({
    queryKey: ["wards"],
    queryFn: async () => {
      try {
  const res = await executeQuery(
    `
    SELECT 
      id, ward_code as wardCode, ward, county, county_code as countyCode, 
      sub_county as subCounty, constituency, constituency_code as constituencyCode
    FROM kenya_wards
    WHERE Within(GeomFromText('POINT(' || ? || ' ' || ? || ')', 4326), geom)
    LIMIT 1
    `,
  [36.817223, -1.286389]
    );
        return {
          result: res,
          error: null,
        };
      } catch (error) {
        return {
          result: null,
          error: error instanceof Error ? error : new Error(JSON.stringify(error)),
        };
      }
    },
  });
  return (
    <Surface style={{ ...styles.container }}>
      <Text variant="titleLarge">KenyanWards</Text>
      <Button onPress={() => refetch()}>Reload</Button>
      {isPending && <Text>Loading...</Text>}
      {isRefetching && <Text>Refetching...</Text>}
      {data && <Text>Ward: {JSON.stringify(data.result, null, 2)}</Text>}
    </Surface>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: 24,
    elevation: 4,
  },
});
