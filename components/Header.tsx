import React from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function Header({ title = "Cadastro de Obras", showBack = true }: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const longTitle = title.length > 18;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        style={[styles.backButton, !showBack && styles.hidden]}
        onPress={() => router.back()}
        disabled={!showBack}
        accessibilityLabel="Voltar"
      >
        <FontAwesome name="arrow-left" size={17} color="#183B56" />
      </TouchableOpacity>
      <View style={[styles.brand, longTitle ? styles.brandStack : styles.brandRow]}>
        <Image source={require("../assets/images/logo.png")} style={[styles.logo, longTitle && styles.logoStack]} resizeMode="contain" />
        <Text numberOfLines={longTitle ? 2 : 1} style={[styles.title, longTitle && styles.longTitle]}>{title}</Text>
      </View>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 22, paddingTop: 8 },
  backButton: { alignItems: "center", backgroundColor: "#E7F6EE", borderRadius: 21, height: 42, justifyContent: "center", width: 42 },
  hidden: { opacity: 0 },
  brand: { alignItems: "center", flex: 1, justifyContent: "center", minWidth: 0 },
  brandRow: { flexDirection: "row" },
  brandStack: { flexDirection: "column", maxWidth: "78%" },
  logo: { height: 42, marginRight: 9, width: 42 },
  logoStack: { marginRight: 0 },
  title: { color: "#183B56", flexShrink: 1, fontSize: 18, fontWeight: "800" },
  longTitle: { marginTop: 4, marginHorizontal: 4, textAlign: "center" },
  spacer: { width: 42 },
});
