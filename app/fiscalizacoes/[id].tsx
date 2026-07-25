import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch } from "@/utils/api";
import Header from "../../components/Header";
import { isoToDdmm } from "../../utils/formatDate";
import { getAuthUser } from "@/utils/session";
import type { Localizacao } from "@/utils/location";

interface Fiscalizacao {
  _id: string;
  data: string;
  status: string;
  observacoes: string;
  foto?: string;
  localizacao?: Localizacao;
  obra?: string | { _id: string; nome: string };
}

export default function DetalheFiscalizacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [fiscalizacao, setFiscalizacao] = useState<Fiscalizacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  function mapaUrl(localizacao: Localizacao) {
    return localizacao.googleMapsUrl || `https://www.google.com/maps?q=${localizacao.lat},${localizacao.long}`;
  }

  useEffect(() => {
    async function carregar() {
      try {
        const response = await apiFetch(`/fiscalizacoes/${id}`);
        setFiscalizacao(await response.json());
      } catch {
        Alert.alert("Erro ao carregar fiscalização");
        router.back();
      } finally {
        setLoading(false);
      }
    }
    carregar();
    void getAuthUser().then((user) => setIsAdmin(user?.role === "admin"));
  }, [id, router]);

  async function excluir() {
    Alert.alert("Confirmar exclusão", "Deseja excluir esta fiscalização?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/fiscalizacoes/${id}`, { method: "DELETE" });
            Alert.alert("Fiscalização excluída com sucesso!");
            router.replace("/fiscalizacoes");
          } catch (error) {
            Alert.alert("Erro ao excluir fiscalização", error instanceof Error ? error.message : undefined);
          }
        },
      },
    ]);
  }

  if (loading || !fiscalizacao) {
    return <ActivityIndicator size="large" color="#27ae60" style={styles.loading} />;
  }

  const nomeObra = typeof fiscalizacao.obra === "object" ? fiscalizacao.obra.nome : "Obra vinculada";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="Detalhes da fiscalização" />
      <Text style={styles.label}>Obra</Text>
      <Text>{nomeObra}</Text>
      <Text style={styles.label}>Data</Text>
      <Text>{fiscalizacao.data ? isoToDdmm(fiscalizacao.data) : "Não informada"}</Text>
      <Text style={styles.label}>Status</Text>
      <Text>{fiscalizacao.status}</Text>
      <Text style={styles.label}>Observações</Text>
      <Text>{fiscalizacao.observacoes}</Text>
      {fiscalizacao.localizacao && (
        <>
          <Text style={styles.label}>Localização</Text>
          <Text>Lat: {fiscalizacao.localizacao.lat} | Long: {fiscalizacao.localizacao.long}</Text>
          {fiscalizacao.localizacao.endereco && <Text>{fiscalizacao.localizacao.endereco}</Text>}
          {fiscalizacao.localizacao.precisao && <Text>Precisão: aproximadamente {fiscalizacao.localizacao.precisao} m</Text>}
          {fiscalizacao.localizacao.capturadoEm && <Text>Coletada em: {new Date(fiscalizacao.localizacao.capturadoEm).toLocaleString("pt-BR")}</Text>}
          <TouchableOpacity onPress={() => void Linking.openURL(mapaUrl(fiscalizacao.localizacao!))}><Text style={styles.mapLink}>Abrir no Google Maps</Text></TouchableOpacity>
        </>
      )}
      {fiscalizacao.foto && <Image source={{ uri: fiscalizacao.foto }} style={styles.image} />}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => router.push(`/fiscalizacoes/editar/${id}`)} activeOpacity={0.85}>
          <FontAwesome name="pencil" size={16} color="#fff" />
          <Text style={styles.actionText}>Editar fiscalização</Text>
        </TouchableOpacity>
        {isAdmin && <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={excluir} activeOpacity={0.85}>
          <FontAwesome name="trash-o" size={16} color="#fff" />
          <Text style={styles.actionText}>Excluir</Text>
        </TouchableOpacity>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, backgroundColor: "#fff", flexGrow: 1 },
  loading: { marginTop: 64 },
  label: { fontWeight: "bold", marginTop: 14, marginBottom: 3 },
  image: { width: "100%", height: 220, borderRadius: 8, marginTop: 18 },
  mapLink: { color: "#2477A8", fontWeight: "800", marginTop: 4 },
  actions: { flexDirection: "row", gap: 10, marginTop: 28 },
  actionButton: { alignItems: "center", borderRadius: 12, flex: 1, flexDirection: "row", justifyContent: "center", minHeight: 52, paddingHorizontal: 10 },
  editButton: { backgroundColor: "#2477A8" },
  deleteButton: { backgroundColor: "#B83B45" },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "800", marginLeft: 8 },
});
