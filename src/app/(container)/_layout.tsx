import { Stack } from "expo-router";
import { useMigrations } from "drizzle-orm/op-sqlite/migrator";
import migrations from "@/drizzle/migrations";
import { db } from "@/lib/drizzle/client";
// this grouped routes  (contaner) layout exists because tanstcak query provider is defined in the root layout making it hard to useQuery in that layout

export default function ContainerLayout() {
  // const { success, error } = useMigrations(db, migrations);

  // success && console.log("success migratting ==> ", success);
  // error && console.log("error migrating =>> ", error);
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
