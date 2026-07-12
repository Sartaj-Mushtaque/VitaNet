import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import Pdf from "react-native-pdf";

const PdfViewerScreen = ({ route }) => {
  const { url } = route.params;

  return (
    <View style={styles.container}>
      <Pdf
        source={{ uri: url, cache: true }}
        style={styles.pdf}
        onError={(error) => {
          console.log("PDF error:", error);
        }}
        onLoadComplete={(numberOfPages) => {
          console.log(`Pages: ${numberOfPages}`);
        }}
        renderActivityIndicator={() => (
          <ActivityIndicator size="large" color="#007AFF" />
        )}
      />
    </View>
  );
};

export default PdfViewerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  pdf: {
    flex: 1,
    width: "100%",
  },
});