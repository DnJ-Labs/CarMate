import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  addButton: {
    padding: 6,
  },

  logoutButton: {
    padding: 6,
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111",
  },

  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },

  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },

  cardInfo: {
    flex: 1,
  },

  cardModel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  cardBrand: {
    fontSize: 13,
    color: "#8b8b8b",
    marginTop: 2,
  },

  cardPlate: {
    fontSize: 12,
    color: "#8b8b8b",
    marginTop: 2,
  },

  bookButton: {
    marginTop: 12,
    backgroundColor: "#4438F5",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },

  bookButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },

  errorText: {
    fontSize: 14,
    color: "#d13c3c",
    textAlign: "center",
  },

  emptyText: {
    fontSize: 14,
    color: "#8b8b8b",
    textAlign: "center",
  },

  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default styles;
