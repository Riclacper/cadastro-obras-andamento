import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { apiFetch } from "@/utils/api";
import { clearAuthToken } from "@/utils/session";

interface Obra {
  _id: string;
  nome: string;
  responsavel: string;
  dataInicio: string;
  dataFim: string;
  descricao: string;
  foto?: string;
  localizacao?: { lat: number; long: number };
}

export default function ListaObras() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function fetchObras() {
    setLoading(true);
    try {
      const res = await apiFetch("/obras");
      const data = await res.json();
      setObras(data);
    } catch (err) {
      alert("Erro ao carregar obras!");
    } finally {
      setLoading(false);
    }
  }

  // Função para refresh puxando com o dedo
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchObras().then(() => setRefreshing(false));
  }, []);

  async function sair() {
    await clearAuthToken();
    router.replace("/login");
  }

  useEffect(() => {
    fetchObras();
  }, []);

  function renderObra({ item }: { item: Obra }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/obras/${item._id}`)}
      >
        {item.foto ? (
          <Image source={{ uri: item.foto }} style={styles.img} />
        ) : (
          <View style={styles.noImg}><Text>Sem Foto</Text></View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.resp}>Responsável: {item.responsavel}</Text>
          <Text style={styles.datas}>
            {item.dataInicio.slice(0, 10)} a {item.dataFim.slice(0, 10)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, padding: 18, backgroundColor: "#fff" }}>
      <View style={styles.titleRow}>
        <Text style={{ fontWeight: "bold", fontSize: 22 }}>Obras cadastradas</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => router.push("/fiscalizacoes")}>
            <Text style={styles.link}>Fiscalizações</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={sair}>
            <Text style={styles.logout}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2d7" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={obras}
          keyExtractor={(item) => item._id}
          renderItem={renderObra}
          ListEmptyComponent={<Text>Nenhuma obra cadastrada.</Text>}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/obras/nova")}
      >
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 28 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#222",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  img: {
    width: 62,
    height: 62,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  noImg: {
    width: 62,
    height: 62,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  nome: {
    fontWeight: "bold",
    fontSize: 17,
    marginBottom: 2,
  },
  resp: {
    fontSize: 14,
    color: "#666",
    marginBottom: 1,
  },
  datas: {
    fontSize: 12,
    color: "#999",
  },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 28,
    backgroundColor: "#27ae60",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  link: { color: "#2980b9", fontWeight: "bold" },
  actions: { flexDirection: "row", gap: 14 },
  logout: { color: "#c0392b", fontWeight: "bold" },
});
