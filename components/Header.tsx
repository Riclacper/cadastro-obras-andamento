import React from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function Header({ title = "Cadastro de Obras", showBack = true }: HeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.backButton, !showBack && styles.hidden]}
        onPress={() => router.back()}
        disabled={!showBack}
        accessibilityLabel="Voltar"
      >
        <FontAwesome name="arrow-left" size={17} color="#183B56" />
      </TouchableOpacity>
      <View style={styles.brand}>
        <Image source={require("../assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 22, paddingTop: 8 },
  backButton: { alignItems: "center", backgroundColor: "#E7F6EE", borderRadius: 21, height: 42, justifyContent: "center", width: 42 },
  hidden: { opacity: 0 },
  brand: { alignItems: "center", flex: 1, flexDirection: "row", justifyContent: "center" },
  logo: { height: 42, marginRight: 9, width: 42 },
  title: { color: "#183B56", fontSize: 18, fontWeight: "800" },
  spacer: { width: 42 },
});
