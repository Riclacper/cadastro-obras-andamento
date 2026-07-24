import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch } from "@/utils/api";
import Header from "../../components/Header";

interface Fiscalizacao {
  _id: string;
  data: string;
  status: string;
  observacoes: string;
  foto?: string;
  localizacao?: { lat: number; long: number };
  obra?: string | { _id: string; nome: string };
}

export default function DetalheFiscalizacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [fiscalizacao, setFiscalizacao] = useState<Fiscalizacao | null>(null);
  const [loading, setLoading] = useState(true);

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
      <Text>{fiscalizacao.data?.slice(0, 10)}</Text>
      <Text style={styles.label}>Status</Text>
      <Text>{fiscalizacao.status}</Text>
      <Text style={styles.label}>Observações</Text>
      <Text>{fiscalizacao.observacoes}</Text>
      {fiscalizacao.localizacao && (
        <>
          <Text style={styles.label}>Localização</Text>
          <Text>Lat: {fiscalizacao.localizacao.lat} | Long: {fiscalizacao.localizacao.long}</Text>
        </>
      )}
      {fiscalizacao.foto && <Image source={{ uri: fiscalizacao.foto }} style={styles.image} />}
      <View style={styles.actions}>
        <Button title="Editar" color="#2980b9" onPress={() => router.push(`/fiscalizacoes/editar/${id}`)} />
        <Button title="Excluir" color="#c0392b" onPress={excluir} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, backgroundColor: "#fff", flexGrow: 1 },
  loading: { marginTop: 64 },
  label: { fontWeight: "bold", marginTop: 14, marginBottom: 3 },
  image: { width: "100%", height: 220, borderRadius: 8, marginTop: 18 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 28 },
});
