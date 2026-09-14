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

  nearestButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#f2f2ff",
  },

  nearestButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5b5be0",
  },

  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },

  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  workshopRow: {
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

  cardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  cardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  cardAddress: {
    fontSize: 13,
    color: "#8b8b8b",
    marginTop: 4,
  },

  cardHours: {
    fontSize: 12,
    color: "#5b5be0",
    marginTop: 4,
  },

  inactiveBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#fceaea",
  },

  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#d13c3c",
  },

  bookingButton: {
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#4438F5",
    alignItems: "center",
  },

  bookingButtonDisabled: {
    backgroundColor: "#d5d5d5",
  },

  bookingButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  pageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
  },

  pageButtonDisabled: {
    backgroundColor: "#f7f7f7",
  },

  pageButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111",
  },

  pageButtonTextDisabled: {
    color: "#c4c4c4",
  },

  pageIndicator: {
    fontSize: 12,
    color: "#8b8b8b",
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
});

export default styles;
