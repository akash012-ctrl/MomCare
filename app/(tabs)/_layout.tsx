import { Tabs } from "expo-router";
import React from "react";

import { AuthGuard } from "@/components/auth-guard";
import { MotherhoodTabBar } from "@/components/navigation/motherhood-tab-bar";

export default function TabLayout() {
  return (
    <AuthGuard>
      <Tabs
        tabBar={(props) => <MotherhoodTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
          }}
        />
        <Tabs.Screen
          name="assistant"
          options={{
            title: "Assistant",
            tabBarStyle: { display: "flex" },
          }}
          listeners={{
            focus: () => {
              // Tab bar will be hidden via the MotherhoodTabBar component keyboard listener
            },
          }}
        />
        <Tabs.Screen
          name="track"
          options={{
            title: "Track",
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}
