import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { apiFetch } from "@/utils/api";
import { getAuthUser } from "@/utils/session";
import Header from "../../components/Header";

type User = { _id: string; nome: string; email: string; role: "admin" | "fiscal" };

export default function UsuariosScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [saving, setSaving] = useState(false);

  async function carregar() {
    try {
      const response = await apiFetch("/auth/users");
      setUsers(await response.json());
    } catch (error) {
      Alert.alert("Acesso restrito", error instanceof Error ? error.message : "Somente administradores podem acessar esta área.");
      router.back();
    } finally { setLoading(false); }
  }

  useEffect(() => { void getAuthUser().then((user) => user?.role === "admin" ? carregar() : router.replace("/(tabs)")); }, [router]);

  async function criarUsuario() {
    if (!nome.trim() || !email.trim() || senha.length < 8) return Alert.alert("Dados incompletos", "Informe nome, e-mail e senha com pelo menos 8 caracteres.");
    setSaving(true);
    try {
      const response = await apiFetch("/auth/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome, email, senha, role: "fiscal" }) });
      if (!response.ok) throw new Error((await response.json()).error || "Não foi possível criar o usuário.");
      setNome(""); setEmail(""); setSenha(""); await carregar();
      Alert.alert("Usuário criado", "O novo usuário poderá entrar como Fiscal.");
    } catch (error) { Alert.alert("Erro ao criar usuário", error instanceof Error ? error.message : "Tente novamente."); }
    finally { setSaving(false); }
  }

  async function alternarPapel(user: User) {
    const role = user.role === "admin" ? "fiscal" : "admin";
    try {
      const response = await apiFetch(`/auth/users/${user._id}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
      if (!response.ok) throw new Error((await response.json()).error || "Não foi possível alterar o papel.");
      await carregar();
    } catch (error) { Alert.alert("Erro ao alterar papel", error instanceof Error ? error.message : "Tente novamente."); }
  }

  if (loading) return <ActivityIndicator size="large" color="#168557" style={styles.loading} />;
  return <ScrollView contentContainerStyle={styles.container}>
    <Header title="Equipe" />
    <Text style={styles.subtitle}>Controle quem pode administrar obras e registrar fiscalizações.</Text>
    <View style={styles.form}>
      <Text style={styles.formTitle}>Adicionar fiscal</Text>
      <TextInput style={styles.input} placeholder="Nome" value={nome} onChangeText={setNome} />
      <TextInput style={styles.input} placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Senha (mínimo 8 caracteres)" secureTextEntry value={senha} onChangeText={setSenha} />
      <TouchableOpacity style={styles.primaryButton} onPress={criarUsuario} disabled={saving}><Text style={styles.buttonText}>{saving ? "Criando..." : "Criar fiscal"}</Text></TouchableOpacity>
    </View>
    {users.map((user) => <View key={user._id} style={styles.userCard}>
      <View style={styles.userInfo}><Text style={styles.userName}>{user.nome}</Text><Text style={styles.userEmail}>{user.email}</Text></View>
      <TouchableOpacity style={[styles.roleBadge, user.role === "admin" ? styles.adminBadge : styles.fiscalBadge]} onPress={() => alternarPapel(user)}><Text style={styles.roleText}>{user.role === "admin" ? "Administrador" : "Fiscal"}</Text></TouchableOpacity>
    </View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, marginTop: 80 }, container: { backgroundColor: "#F4F8F6", flexGrow: 1, padding: 20 }, subtitle: { color: "#718096", fontSize: 14, marginBottom: 18 }, form: { backgroundColor: "#fff", borderRadius: 16, padding: 16 }, formTitle: { color: "#183B56", fontSize: 17, fontWeight: "800", marginBottom: 12 }, input: { borderColor: "#DDEAE3", borderRadius: 10, borderWidth: 1, marginBottom: 10, padding: 12 }, primaryButton: { alignItems: "center", backgroundColor: "#168557", borderRadius: 10, padding: 14 }, buttonText: { color: "#fff", fontWeight: "800" }, userCard: { alignItems: "center", backgroundColor: "#fff", borderColor: "#E2ECE7", borderRadius: 14, borderWidth: 1, flexDirection: "row", marginTop: 10, padding: 14 }, userInfo: { flex: 1 }, userName: { color: "#183B56", fontWeight: "800" }, userEmail: { color: "#718096", fontSize: 12, marginTop: 3 }, roleBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 }, adminBadge: { backgroundColor: "#E7F6EE" }, fiscalBadge: { backgroundColor: "#FFF3E0" }, roleText: { color: "#183B56", fontSize: 11, fontWeight: "800" }
});
