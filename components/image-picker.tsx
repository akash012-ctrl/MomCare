import { useAppAlert } from "@/components/ui/app-alert";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePickerLib from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface ImagePickerProps {
  onImageSelected: (
    base64: string,
    mimeType: string,
    width: number,
    height: number
  ) => Promise<void>;
  onError?: (error: string) => void;
  previewSize?: number;
  maxSizeMB?: number;
  compressionQuality?: number;
  allowCamera?: boolean;
  allowGallery?: boolean;
}

export interface PickedImage {
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  uri: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  onImageSelected,
  onError,
  previewSize = 200,
  maxSizeMB = 5,
  compressionQuality = 0.8,
  allowCamera = true,
  allowGallery = true,
}) => {
  const { showAlert } = useAppAlert();
  const [selectedImage, setSelectedImage] = useState<PickedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const accentColor = "#FF9FA3";

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePickerLib.requestCameraPermissionsAsync();
    return status === "granted";
  };

  const requestGalleryPermission = async (): Promise<boolean> => {
    const { status } =
      await ImagePickerLib.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  };

  const pickImage = async (
    source: "camera" | "gallery"
  ): Promise<PickedImage | null> => {
    try {
      setLoading(true);

      // Request permissions
      if (source === "camera") {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          throw new Error("Camera permission denied");
        }
      } else {
        const hasPermission = await requestGalleryPermission();
        if (!hasPermission) {
          throw new Error("Gallery permission denied");
        }
      }

      // Launch picker
      const result = await (source === "camera"
        ? ImagePickerLib.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: compressionQuality,
            base64: true,
          })
        : ImagePickerLib.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: compressionQuality,
            base64: true,
          }));

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];

      // Validate size
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (asset.base64) {
        const base64Bytes = (asset.base64.length * 3) / 4;
        if (base64Bytes > maxBytes) {
          throw new Error(
            `Image too large (${(base64Bytes / 1024 / 1024).toFixed(
              2
            )}MB). Max: ${maxSizeMB}MB`
          );
        }
      }

      const mimeType = asset.mimeType || "image/jpeg";
      const base64 = asset.base64 || "";

      if (!base64) {
        throw new Error("Failed to get image data");
      }

      return {
        base64,
        mimeType,
        width: asset.width,
        height: asset.height,
        uri: asset.uri,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      onError?.(errorMessage);
      showAlert({
        title: "Error",
        message: errorMessage,
        type: "error",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePickFromCamera = async () => {
    setModalVisible(false);
    const image = await pickImage("camera");
    if (image) {
      setSelectedImage(image);
      try {
        await onImageSelected(
          image.base64,
          image.mimeType,
          image.width,
          image.height
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        onError?.(errorMessage);
        showAlert({
          title: "Error",
          message: errorMessage,
          type: "error",
        });
      }
    }
  };

  const handlePickFromGallery = async () => {
    setModalVisible(false);
    const image = await pickImage("gallery");
    if (image) {
      setSelectedImage(image);
      try {
        await onImageSelected(
          image.base64,
          image.mimeType,
          image.width,
          image.height
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        onError?.(errorMessage);
        showAlert({
          title: "Error",
          message: errorMessage,
          type: "error",
        });
      }
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
  };

  return (
    <View>
      {/* Preview */}
      {selectedImage && (
        <View
          style={[
            styles.previewContainer,
            { width: previewSize, height: previewSize },
          ]}
        >
          <Image
            source={{ uri: selectedImage.uri }}
            style={{ width: "100%", height: "100%", borderRadius: 12 }}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={accentColor} />
            </View>
          )}
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: accentColor }]}
            onPress={handleClear}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Pick Button */}
      {!selectedImage && (
        <TouchableOpacity
          style={[styles.pickButton, { backgroundColor: accentColor }]}
          onPress={() => setModalVisible(true)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="image" size={24} color="#fff" />
              <Text style={styles.pickButtonText}>Pick Image</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Source Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View style={[styles.modalContent, { backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Select Image Source
            </Text>

            {allowCamera && (
              <TouchableOpacity
                style={[styles.sourceButton, { backgroundColor: accentColor }]}
                onPress={handlePickFromCamera}
              >
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.sourceButtonText}>Take Photo</Text>
              </TouchableOpacity>
            )}

            {allowGallery && (
              <TouchableOpacity
                style={[styles.sourceButton, { backgroundColor: accentColor }]}
                onPress={handlePickFromGallery}
              >
                <Ionicons name="images" size={24} color="#fff" />
                <Text style={styles.sourceButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: textColor }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    position: "relative",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  clearButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  pickButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  pickButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  sourceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  sourceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
