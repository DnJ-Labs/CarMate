import { useState, useCallback, useRef, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import baseUrl from "../../constant/baseUrl";
import styles from "../styles/allWorkshopsStyles";

const LIMIT = 10;
const TAB_BAR_HEIGHT = 40;
const SKELETON_COUNT = 5;
const SEARCH_DEBOUNCE_MS = 400;

/* ---------------------------------------------------------
 * SKELETON LOADING (pulse boxes)
 * ------------------------------------------------------- */
function SkeletonBox({ style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeletonBox, style, { opacity }]} />;
}

function WorkshopCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBox style={styles.cardImage} />

      <View style={styles.cardInfo}>
        <SkeletonBox style={styles.skeletonLineTitle} />
        <SkeletonBox style={styles.skeletonLineAddress} />
        <SkeletonBox style={styles.skeletonLineHours} />
      </View>
    </View>
  );
}

function WorkshopListSkeleton() {
  return (
    <View style={styles.listContent}>
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <WorkshopCardSkeleton key={index} />
      ))}
    </View>
  );
}

export function Workshop() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [workshops, setWorkshops] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // guards against onEndReached firing multiple times for the same page
  const isFetchingRef = useRef(false);
  // skips the debounce effect's fetch on first mount (useFocusEffect already handles it)
  const isFirstSearchRunRef = useRef(true);
  const searchTimeoutRef = useRef(null);

  const fetchWorkshops = useCallback(
    async (
      pageToFetch = 1,
      { append = false, isRefresh = false, searchTerm = "" } = {},
    ) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        setError(null);

        const token = await SecureStore.getItemAsync("access_token");

        if (!token) {
          setError("Sesi habis, silakan login ulang");
          return;
        }

        const { data } = await axios.get(`${baseUrl}/api/workshop`, {
          params: {
            page: pageToFetch,
            limit: LIMIT,
            ...(searchTerm ? { search: searchTerm } : {}),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const newWorkshops = data.data ?? [];

        setWorkshops((prev) =>
          append ? [...prev, ...newWorkshops] : newWorkshops,
        );
        setLastPage(data.meta?.lastPage ?? 1);
        setPage(pageToFetch);
      } catch (err) {
        setError(
          err.response?.data?.message || "Gagal mengambil data workshop",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchWorkshops(1, { searchTerm: search });
      // only re-run on focus, not on every keystroke — search changes are
      // handled by the debounce effect below
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchWorkshops]),
  );

  // debounce search input, then refetch from page 1
  useEffect(() => {
    if (isFirstSearchRunRef.current) {
      isFirstSearchRunRef.current = false;
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setLoading(true);
      fetchWorkshops(1, { searchTerm: search });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [search, fetchWorkshops]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkshops(1, { isRefresh: true, searchTerm: search });
  };

  const loadMore = () => {
    if (loading || loadingMore || refreshing) return;
    if (page >= lastPage) return;

    setLoadingMore(true);
    fetchWorkshops(page + 1, { append: true, searchTerm: search });
  };

  const clearSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setSearch("");
    setLoading(true);
    fetchWorkshops(1, { searchTerm: "" });
  };

  const getTodayHours = (operationalHours) => {
    if (!operationalHours?.length) {
      return null;
    }

    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const today = days[new Date().getDay()];

    const todaySchedule = operationalHours.find((h) => h.day === today);

    if (!todaySchedule) {
      return "Tutup hari ini";
    }

    return `${todaySchedule.open} - ${todaySchedule.close}`;
  };

  const renderWorkshopCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate("WorkshopDetail", {
          workshopId: String(item._id),
          workshop: item,
        })
      }
    >
      {item.workshop_img ? (
        <Image
          source={{ uri: item.workshop_img }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Ionicons name="construct-outline" size={28} color="#8CA3C7" />
        </View>
      )}

      {!item.is_active && (
        <View style={styles.cardImageOverlay}>
          <Text style={styles.cardImageOverlayText}>Tutup</Text>
        </View>
      )}

      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name}
        </Text>

        {item.address && (
          <View style={styles.cardMetaRow}>
            <Ionicons name="location-outline" size={13} color="#94A3B8" />
            <Text style={styles.cardAddress} numberOfLines={2}>
              {item.address}
            </Text>
          </View>
        )}

        {getTodayHours(item.operational_hours) && (
          <View style={styles.hoursRow}>
            <Ionicons name="time-outline" size={13} color="#94A3B8" />
            <Text style={styles.cardHours}>
              {getTodayHours(item.operational_hours)}
            </Text>
          </View>
        )}
      </View>

      <Ionicons
        name="chevron-forward-outline"
        size={18}
        color="#CBD5E1"
        style={styles.cardChevron}
      />
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) {
      // reserve space so the last card isn't hidden behind the tab bar
      return <View style={{ height: TAB_BAR_HEIGHT + insets.bottom + 12 }} />;
    }

    return (
      <View style={styles.skeletonFooterLoader}>
        <ActivityIndicator size="small" color="#0F2C59" />
      </View>
    );
  };

  const isSearching = search.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workshop</Text>

        <TouchableOpacity
          style={styles.nearestButton}
          onPress={() => navigation.navigate("NearestWorkshop")}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate-outline" size={15} color="#FFFFFF" />

          <Text style={styles.nearestButtonText}>Terdekat</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View
        style={[
          styles.searchWrapper,
          isSearchFocused && styles.searchWrapperFocused,
        ]}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={isSearchFocused ? "#0F2C59" : "#94A3B8"}
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Cari nama workshop..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {isSearching && (
          <TouchableOpacity
            onPress={clearSearch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <WorkshopListSkeleton />
      ) : error && workshops.length === 0 ? (
        <View style={styles.centerContent}>
          <View style={styles.stateIconWrapper}>
            <Ionicons name="alert-circle-outline" size={32} color="#E53E3E" />
          </View>

          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : workshops.length === 0 ? (
        <View style={styles.centerContent}>
          <View style={styles.stateIconWrapper}>
            <Ionicons
              name={isSearching ? "search-outline" : "construct-outline"}
              size={32}
              color="#A0AEC0"
            />
          </View>

          <Text style={styles.emptyText}>
            {isSearching
              ? `Tidak ditemukan workshop untuk "${search}"`
              : "Belum ada workshop"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={workshops}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderWorkshopCard}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
        />
      )}
    </SafeAreaView>
  );
}