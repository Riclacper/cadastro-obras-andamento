import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { apiFetch } from "@/utils/api";
import { clearAuthToken, getAuthUser } from "@/utils/session";

interface Obra {
  _id: string;
  nome: string;
  responsavel: string;
  dataInicio: string;
  dataFim: string;
  status?: string;
  descricao?: string;
  foto?: string;
  localizacao?: { lat: number; long: number };
}

interface FiscalizacaoResumo {
  _id: string;
  data: string;
  status: string;
  observacoes: string;
  obra?: string | { _id: string; nome: string };
}

const colors = {
  ink: "#183B56",
  muted: "#718096",
  primary: "#1F9D68",
  primaryDark: "#147A50",
  surface: "#FFFFFF",
  background: "#F4F8F6",
  border: "#E2ECE7",
  warning: "#D97706",
  danger: "#C24146",
};

function formatDate(value?: string) {
  if (!value) return "Data não informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function getStatus(statusValue?: string, dataFim?: string) {
  if (statusValue === "Concluída") return { label: "Concluída", color: "#168557", icon: "check-circle" as const };
  if (statusValue === "Pausada") return { label: "Pausada", color: "#B83B45", icon: "pause-circle" as const };
  if (statusValue === "Planejada") return { label: "Planejada", color: "#2477A8", icon: "calendar-o" as const };
  if (statusValue === "Em andamento") return { label: "Em andamento", color: "#D97706", icon: "clock-o" as const };
  if (!dataFim) return { label: "Sem prazo", color: colors.muted, icon: "calendar-o" as const };
  const end = new Date(dataFim);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (end < today) return { label: "Prazo encerrado", color: colors.danger, icon: "clock-o" as const };
  const days = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  if (days <= 30) return { label: "Atenção ao prazo", color: colors.warning, icon: "exclamation-circle" as const };
  return { label: "Em andamento", color: colors.primary, icon: "check-circle-o" as const };
}

export default function ListaObras() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [fiscalizacoes, setFiscalizacoes] = useState<FiscalizacaoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const fetchObras = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError("");
    try {
      const [obrasResponse, fiscalizacoesResponse] = await Promise.all([apiFetch("/obras"), apiFetch("/fiscalizacoes")]);
      if (!obrasResponse.ok || !fiscalizacoesResponse.ok) throw new Error("Não foi possível carregar o dashboard.");
      const [obrasData, fiscalizacoesData] = await Promise.all([obrasResponse.json(), fiscalizacoesResponse.json()]);
      setObras(Array.isArray(obrasData) ? obrasData : []);
      setFiscalizacoes(Array.isArray(fiscalizacoesData) ? fiscalizacoesData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verifique a conexão com a API.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchObras(true);
    void getAuthUser().then((user) => setIsAdmin(user?.role === "admin"));
  }, [fetchObras]);

  const filteredObras = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return obras;
    return obras.filter((obra) =>
      [obra.nome, obra.responsavel, obra.descricao].some((value) => value?.toLowerCase().includes(term))
    );
  }, [obras, search]);

  async function sair() {
    await clearAuthToken();
    router.replace("/login");
  }

  function renderObra({ item }: { item: Obra }) {
    const status = getStatus(item.status, item.dataFim);
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        style={styles.card}
        onPress={() => router.push(`/obras/${item._id}`)}
      >
        {item.foto ? (
          <Image source={{ uri: item.foto }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <FontAwesome name="building-o" size={24} color={colors.primary} />
          </View>
        )}
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.nome}</Text>
            <FontAwesome name="angle-right" size={20} color="#A5B5AE" />
          </View>
          <Text style={styles.owner} numberOfLines={1}>
            <FontAwesome name="user-o" size={12} color={colors.muted} /> {item.responsavel || "Responsável não informado"}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.date}>
              <FontAwesome name="calendar-o" size={12} color={colors.muted} /> {formatDate(item.dataInicio)} — {formatDate(item.dataFim)}
            </Text>
            <View style={[styles.status, { backgroundColor: `${status.color}18` }]}>
              <FontAwesome name={status.icon} size={11} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const concluidas = obras.filter((obra) => getStatus(obra.status, obra.dataFim).label === "Concluída").length;
  const emAndamento = obras.filter((obra) => getStatus(obra.status, obra.dataFim).label === "Em andamento").length;
  const pausadas = obras.filter((obra) => getStatus(obra.status, obra.dataFim).label === "Pausada").length;
  const proximasDoVencimento = obras.filter((obra) => {
    if (obra.status === "Concluída" || obra.status === "Pausada" || !obra.dataFim) return false;
    const dias = Math.ceil((new Date(obra.dataFim).getTime() - Date.now()) / 86400000);
    return dias >= 0 && dias <= 30;
  }).length;
  const recentes = [...fiscalizacoes].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filteredObras}
        keyExtractor={(item) => item._id}
        renderItem={renderObra}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetchObras(); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>PAINEL DE CONTROLE</Text>
                <Text style={styles.heading}>Olá, fiscal 👋</Text>
                <Text style={styles.subtitle}>Acompanhe suas obras em um só lugar.</Text>
              </View>
              <View style={styles.headerActions}>
                {isAdmin && <TouchableOpacity style={styles.teamButton} onPress={() => router.push("/usuarios")}><FontAwesome name="users" size={14} color={colors.primaryDark} /><Text style={styles.teamText}>Equipe</Text></TouchableOpacity>}
                <TouchableOpacity style={styles.logoutButton} onPress={sair} accessibilityLabel="Sair"><FontAwesome name="sign-out" size={17} color={colors.muted} /></TouchableOpacity>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}><Text style={styles.metricValue}>{obras.length}</Text><Text style={styles.metricLabel}>Total de obras</Text></View>
              <View style={styles.metricCard}><Text style={[styles.metricValue, { color: "#168557" }]}>{concluidas}</Text><Text style={styles.metricLabel}>Concluídas</Text></View>
              <View style={styles.metricCard}><Text style={[styles.metricValue, { color: "#D97706" }]}>{emAndamento}</Text><Text style={styles.metricLabel}>Em andamento</Text></View>
              <View style={styles.metricCard}><Text style={[styles.metricValue, { color: "#B83B45" }]}>{pausadas}</Text><Text style={styles.metricLabel}>Pausadas</Text></View>
            </View>

            <View style={styles.insightsRow}>
              <View style={styles.insightCard}><FontAwesome name="calendar-o" size={16} color="#D97706" /><Text style={styles.insightText}><Text style={styles.insightValue}>{proximasDoVencimento}</Text> próximas do vencimento</Text></View>
              <View style={styles.insightCard}><FontAwesome name="clipboard" size={16} color={colors.primary} /><Text style={styles.insightText}><Text style={styles.insightValue}>{fiscalizacoes.length}</Text> fiscalizações</Text></View>
            </View>

            {recentes.length > 0 && <View style={styles.recentPanel}>
              <View style={styles.recentHeader}><Text style={styles.recentTitle}>Fiscalizações recentes</Text><TouchableOpacity onPress={() => router.push("/fiscalizacoes")}><Text style={styles.link}>Ver todas</Text></TouchableOpacity></View>
              {recentes.map((item) => <TouchableOpacity key={item._id} style={styles.recentItem} onPress={() => router.push(`/fiscalizacoes/${item._id}`)}><View style={styles.recentDot} /><View style={styles.recentBody}><Text style={styles.recentStatus}>{item.status}</Text><Text style={styles.recentObservation} numberOfLines={1}>{item.observacoes}</Text></View><Text style={styles.recentDate}>{formatDate(item.data)}</Text></TouchableOpacity>)}
            </View>}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Minhas obras</Text>
              <TouchableOpacity onPress={() => router.push("/fiscalizacoes")}>
                <Text style={styles.link}>Fiscalizações</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <FontAwesome name="search" size={15} color={colors.muted} />
              <TextInput
                placeholder="Buscar por obra ou responsável"
                placeholderTextColor="#9AA9A2"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {!!search && <TouchableOpacity onPress={() => setSearch("")}><FontAwesome name="times-circle" size={16} color={colors.muted} /></TouchableOpacity>}
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <FontAwesome name="wifi" size={16} color={colors.danger} />
                <View style={styles.errorContent}><Text style={styles.errorTitle}>Não foi possível atualizar</Text><Text style={styles.errorText}>{error}</Text></View>
                <TouchableOpacity onPress={() => void fetchObras(true)}><Text style={styles.retry}>Tentar</Text></TouchableOpacity>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? <ActivityIndicator size="large" color={colors.primary} style={styles.loader} /> :
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><FontAwesome name="folder-open-o" size={30} color={colors.primary} /></View>
            <Text style={styles.emptyTitle}>{search ? "Nenhuma obra encontrada" : "Comece seu cadastro"}</Text>
            <Text style={styles.emptyText}>{search ? "Tente buscar por outro termo." : "Cadastre a primeira obra para acompanhar sua evolução."}</Text>
          </View>
        }
      />

      {isAdmin && <TouchableOpacity style={styles.fab} onPress={() => router.push("/obras/nova")} activeOpacity={0.9}>
        <FontAwesome name="plus" size={18} color="#fff" />
        <Text style={styles.fabText}>Nova obra</Text>
      </TouchableOpacity>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 20, paddingBottom: 112 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 },
  headerActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  teamButton: { alignItems: "center", backgroundColor: "#E7F6EE", borderRadius: 18, flexDirection: "row", paddingHorizontal: 10, paddingVertical: 9 },
  teamText: { color: colors.primaryDark, fontSize: 11, fontWeight: "800", marginLeft: 5 },
  eyebrow: { color: colors.primaryDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.4, marginBottom: 6 },
  heading: { color: colors.ink, fontSize: 30, fontWeight: "800", letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 5 },
  logoutButton: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  metricCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexBasis: "47%", flexGrow: 1, minHeight: 76, padding: 13 },
  metricValue: { color: colors.ink, fontSize: 24, fontWeight: "800" },
  metricLabel: { color: colors.muted, fontSize: 11, marginTop: 3 },
  insightsRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  insightCard: { alignItems: "center", backgroundColor: "#E7F6EE", borderRadius: 12, flex: 1, flexDirection: "row", minHeight: 48, paddingHorizontal: 12 },
  insightText: { color: colors.muted, flex: 1, fontSize: 11, marginLeft: 8 },
  insightValue: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  recentPanel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, marginBottom: 24, padding: 14 },
  recentHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  recentTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  recentItem: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", paddingVertical: 11 },
  recentDot: { backgroundColor: colors.primary, borderRadius: 5, height: 10, marginRight: 10, width: 10 },
  recentBody: { flex: 1, minWidth: 0 },
  recentStatus: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  recentObservation: { color: colors.muted, fontSize: 11, marginTop: 3 },
  recentDate: { color: colors.muted, fontSize: 10, marginLeft: 8 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: "800" },
  link: { color: colors.primaryDark, fontSize: 13, fontWeight: "700" },
  searchBox: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", marginBottom: 16, paddingHorizontal: 14 },
  searchInput: { color: colors.ink, flex: 1, fontSize: 14, paddingHorizontal: 10, paddingVertical: 12 },
  errorBox: { alignItems: "center", backgroundColor: "#FFF1F1", borderRadius: 12, flexDirection: "row", marginBottom: 16, padding: 12 },
  errorContent: { flex: 1, marginHorizontal: 10 },
  errorTitle: { color: colors.danger, fontSize: 13, fontWeight: "800" },
  errorText: { color: "#8A4A4D", fontSize: 12, marginTop: 2 },
  retry: { color: colors.danger, fontSize: 12, fontWeight: "800" },
  card: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", marginBottom: 12, padding: 10 },
  image: { backgroundColor: "#EAF1ED", borderRadius: 12, height: 78, marginRight: 13, width: 78 },
  imagePlaceholder: { alignItems: "center", backgroundColor: "#E7F6EE", borderRadius: 12, height: 78, justifyContent: "center", marginRight: 13, width: 78 },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { color: colors.ink, flex: 1, fontSize: 16, fontWeight: "800", marginRight: 8 },
  owner: { color: colors.muted, fontSize: 12, marginTop: 8 },
  cardFooter: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  date: { color: colors.muted, flex: 1, fontSize: 10 },
  status: { alignItems: "center", borderRadius: 8, flexDirection: "row", paddingHorizontal: 7, paddingVertical: 5 },
  statusText: { fontSize: 9, fontWeight: "800", marginLeft: 4 },
  loader: { marginTop: 42 },
  empty: { alignItems: "center", paddingHorizontal: 30, paddingTop: 42 },
  emptyIcon: { alignItems: "center", backgroundColor: "#E7F6EE", borderRadius: 24, height: 64, justifyContent: "center", marginBottom: 14, width: 64 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  emptyText: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7, textAlign: "center" },
  fab: { alignItems: "center", backgroundColor: colors.primaryDark, borderRadius: 27, bottom: 22, elevation: 5, flexDirection: "row", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 15, position: "absolute", right: 20, shadowColor: "#0E4B32", shadowOffset: { height: 4, width: 0 }, shadowOpacity: 0.24, shadowRadius: 8 },
  fabText: { color: "#fff", fontSize: 14, fontWeight: "800", marginLeft: 9 },
});
