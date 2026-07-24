import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { apiFetch } from "@/utils/api";

interface Fiscalizacao {
  _id: string;
  data: string;
  status: string;
  observacoes: string;
  obra?: string | { _id: string; nome: string };
}

export default function ListaFiscalizacoes() {
  const router = useRouter();
  const [fiscalizacoes, setFiscalizacoes] = useState<Fiscalizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregarFiscalizacoes = useCallback(async () => {
    try {
      const response = await apiFetch("/fiscalizacoes");
      setFiscalizacoes(await response.json());
    } catch {
      setFiscalizacoes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarFiscalizacoes();
  }, [carregarFiscalizacoes]);

  const atualizar = useCallback(async () => {
    setRefreshing(true);
    await carregarFiscalizacoes();
    setRefreshing(false);
  }, [carregarFiscalizacoes]);

  function nomeDaObra(obra?: Fiscalizacao["obra"]) {
    return typeof obra === "object" ? obra.nome : "Obra vinculada";
  }

  if (loading) {
    return <ActivityIndicator size="large" color="#27ae60" style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fiscalizações</Text>
      <FlatList
        data={fiscalizacoes}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={atualizar} />}
        contentContainerStyle={fiscalizacoes.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={<Text>Nenhuma fiscalização cadastrada.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/fiscalizacoes/${item._id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.status}>{item.status}</Text>
              <Text style={styles.date}>{item.data?.slice(0, 10)}</Text>
            </View>
            <Text style={styles.obra}>{nomeDaObra(item.obra)}</Text>
            <Text numberOfLines={2} style={styles.observacoes}>{item.observacoes}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/fiscalizacoes/nova")}
        accessibilityLabel="Cadastrar fiscalização"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: "#fff" },
  loading: { marginTop: 64 },
  title: { fontWeight: "bold", fontSize: 22, marginBottom: 18 },
  list: { paddingBottom: 90 },
  emptyList: { flexGrow: 1 },
  card: {
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#222",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  status: { fontWeight: "bold", color: "#2980b9" },
  date: { color: "#777" },
  obra: { fontWeight: "600", marginBottom: 5 },
  observacoes: { color: "#555" },
  fab: {
    position: "absolute", bottom: 28, right: 28, backgroundColor: "#27ae60",
    width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", elevation: 4,
  },
  fabText: { color: "#fff", fontWeight: "bold", fontSize: 28 },
});
