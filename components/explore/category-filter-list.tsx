import React from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

import { CategoryChip } from "./category-chip";

const { spacing } = MotherhoodTheme;

interface CategoryFilterListProps {
    categories: string[];
    selectedCategory: string;
    onSelect: (category: string) => void;
}

export function CategoryFilterList({ categories, selectedCategory, onSelect }: CategoryFilterListProps) {
    return (
        <View style={styles.container}>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categories}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.content}
                renderItem={({ item }) => (
                    <CategoryChip
                        category={item}
                        isActive={selectedCategory === item}
                        onPress={() => onSelect(item)}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    content: {
        paddingRight: spacing.md,
    },
});
