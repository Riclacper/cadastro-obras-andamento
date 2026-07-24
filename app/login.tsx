import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { apiFetch } from "@/utils/api";
import { setAuthToken } from "@/utils/session";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha) {
      Alert.alert("Informe seu e-mail e sua senha.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), senha }),
      });
      const data = await response.json();
      const token = data.token || data.accessToken;

      if (typeof token !== "string" || !token) {
        throw new Error("A resposta do login não contém um token válido.");
      }

      await setAuthToken(token);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Não foi possível entrar",
        error instanceof Error ? error.message : "Verifique seus dados e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Cadastro de Obras</Text>
      <Text style={styles.subtitle}>Entre para acompanhar suas obras</Text>
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        editable={!loading}
      />
      <TouchableOpacity style={styles.button} onPress={entrar} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f5f6fa" },
  title: { color: "#2980b9", fontSize: 28, fontWeight: "bold", textAlign: "center" },
  subtitle: { color: "#666", marginBottom: 28, marginTop: 8, textAlign: "center" },
  input: { backgroundColor: "#fff", borderColor: "#27ae60", borderRadius: 8, borderWidth: 1, marginBottom: 14, padding: 14 },
  button: { alignItems: "center", backgroundColor: "#27ae60", borderRadius: 8, padding: 14 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
