import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { MotiView } from "moti";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MotherhoodTheme } from "@/constants/theme";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

interface ImageUploadProps {
  onImageSelect: (imageUri: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function ImageUpload({
  onImageSelect,
  onError,
  disabled,
}: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    try {
      setIsLoading(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        onError?.(
          "Camera roll access denied. Check app permissions in settings."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        onImageSelect(imageUri);
      }
    } catch (error) {
      onError?.(`Error selecting image: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setIsLoading(true);

      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        onError?.("Camera access denied. Check app permissions in settings.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        onImageSelect(imageUri);
      }
    } catch (error) {
      onError?.(`Error taking photo: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
  };

  if (selectedImage) {
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 250 }}
        style={styles.selectedContainer}
      >
        <View style={styles.selectedImageWrapper}>
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          <Pressable
            onPress={handleClear}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.clearButtonPressed,
            ]}
          >
            <Ionicons name="close-circle" size={32} color={colors.secondary} />
          </Pressable>
        </View>
        <Text style={styles.selectedText}>Image selected & ready</Text>
      </MotiView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <Pressable
          onPress={takePhoto}
          disabled={isLoading || disabled}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            (isLoading || disabled) && styles.buttonDisabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.secondary} size="small" />
          ) : (
            <>
              <Ionicons name="camera" size={24} color={colors.secondary} />
              <Text style={styles.buttonText}>Take Photo</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={pickImage}
          disabled={isLoading || disabled}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            (isLoading || disabled) && styles.buttonDisabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.secondary} size="small" />
          ) : (
            <>
              <Ionicons name="image" size={24} color={colors.secondary} />
              <Text style={styles.buttonText}>Pick Image</Text>
            </>
          )}
        </Pressable>
      </View>

      <Text style={styles.hint}>
        Upload a photo for AI analysis (pregnancy-safe food, skin conditions,
        etc.)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    flex: 1,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadows.soft,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: typography.label,
    fontWeight: "600",
    color: colors.secondary,
  },
  selectedContainer: {
    alignItems: "center",
    gap: spacing.md,
  },
  selectedImageWrapper: {
    position: "relative",
    width: 150,
    height: 150,
  },
  selectedImage: {
    width: "100%",
    height: "100%",
    borderRadius: radii.lg,
    ...shadows.soft,
  },
  clearButton: {
    position: "absolute",
    top: -12,
    right: -12,
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  clearButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  selectedText: {
    fontSize: typography.label,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  hint: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
});
