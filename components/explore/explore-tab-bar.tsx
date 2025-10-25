import React from "react";
import { StyleSheet, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

import { TabButton, type TabConfig } from "./tab-button";

const { colors } = MotherhoodTheme;

interface ExploreTabBarProps {
    tabs: TabConfig[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export function ExploreTabBar({ tabs, activeTab, onTabChange }: ExploreTabBarProps) {
    return (
        <View style={styles.container}>
            {tabs.map((tab) => (
                <TabButton
                    key={tab.id}
                    tab={tab}
                    isActive={activeTab === tab.id}
                    onPress={() => onTabChange(tab.id)}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: `${colors.primary}30`,
    },
});
