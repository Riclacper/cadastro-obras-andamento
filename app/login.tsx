import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { apiFetch } from "@/utils/api";
import { setAuthToken, setAuthUser } from "@/utils/session";

const colors = { ink: "#183B56", muted: "#718096", primary: "#1F9D68", primaryDark: "#147A50", background: "#F4F8F6", surface: "#FFFFFF", border: "#DDEAE3" };

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "senha" | null>(null);

  async function entrar() {
    if (!email.trim() || !senha) {
      Alert.alert("Dados incompletos", "Informe seu e-mail e sua senha.");
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
      if (data.user?.id && (data.user.role === "admin" || data.user.role === "fiscal")) await setAuthUser(data.user);
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
      <Image source={require("../assets/images/logo.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="Logo Cadastro de Obras" />
      <Text style={styles.kicker}>GESTÃO INTELIGENTE</Text>
      <Text style={styles.title}>Cadastro de Obras</Text>
      <Text style={styles.subtitle}>Acompanhe projetos, prazos e fiscalizações em um só lugar.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>E-mail</Text>
        <View style={[styles.inputWrap, focusedField === "email" && styles.inputWrapFocused]}>
          <FontAwesome name="envelope-o" size={16} color={colors.muted} />
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#A1B0A8"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
          />
        </View>
        <Text style={styles.label}>Senha</Text>
        <View style={[styles.inputWrap, focusedField === "senha" && styles.inputWrapFocused]}>
          <FontAwesome name="lock" size={18} color={colors.muted} />
          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            placeholderTextColor="#A1B0A8"
            value={senha}
            onChangeText={setSenha}
            onFocus={() => setFocusedField("senha")}
            onBlur={() => setFocusedField(null)}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword((value) => !value)} accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}>
            <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={17} color={colors.muted} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={entrar} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.buttonText}>Entrar no painel</Text><FontAwesome name="arrow-right" size={16} color="#fff" /></>}
        </TouchableOpacity>
      </View>
      <Text style={styles.footer}>Ambiente seguro para acompanhamento de obras</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: 24 },
  logo: { alignSelf: "center", height: 144, marginBottom: 10, width: 144 },
  kicker: { color: colors.primaryDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.5, textAlign: "center" },
  title: { color: colors.ink, fontSize: 30, fontWeight: "800", marginTop: 7, textAlign: "center" },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginHorizontal: 16, marginTop: 9, textAlign: "center" },
  form: { alignSelf: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, marginTop: 30, maxWidth: 560, padding: 20, width: "100%" },
  label: { color: colors.ink, fontSize: 12, fontWeight: "800", marginBottom: 7, marginTop: 4 },
  inputWrap: { alignItems: "center", borderColor: colors.border, borderRadius: 11, borderWidth: 1, flexDirection: "row", marginBottom: 15, paddingHorizontal: 13 },
  inputWrapFocused: { borderColor: colors.primary, borderWidth: 2, shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 4 },
  input: { color: colors.ink, flex: 1, fontSize: 15, paddingHorizontal: 10, paddingVertical: 13 },
  button: { alignItems: "center", backgroundColor: colors.primaryDark, borderRadius: 11, flexDirection: "row", justifyContent: "center", marginTop: 5, padding: 15 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800", marginRight: 10 },
  footer: { color: colors.muted, fontSize: 12, marginTop: 24, textAlign: "center" },
});
