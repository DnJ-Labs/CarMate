import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  emptyContent: {
    flexGrow: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F7FB",
  },

  header: {
    paddingTop: 25,
    paddingBottom: 25,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    fontSize: 14,
    color: "#8A8F9C",
    marginTop: 6,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bookingLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.8,
    marginBottom: 5,
  },

  bookingCode: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  statusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  statusPending: {
    backgroundColor: "#FFF4D6",
  },

  statusConfirmed: {
    backgroundColor: "#E8F1FF",
  },

  statusCheckedIn: {
    backgroundColor: "#EDE9FE",
  },

  statusOnProgress: {
    backgroundColor: "#E8F7F0",
  },

  statusDone: {
    backgroundColor: "#DCFCE7",
  },

  statusCancelled: {
    backgroundColor: "#FEE2E2",
  },

  divider: {
    height: 1,
    backgroundColor: "#F0F1F4",
    marginVertical: 16,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  infoLabel: {
    fontSize: 13,
    color: "#8A8F9C",
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    maxWidth: "60%",
    textAlign: "right",
  },

  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: "#F0F1F4",
    marginTop: 5,
    paddingTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },

  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4438F5",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  emptyText: {
    fontSize: 14,
    color: "#8A8F9C",
    textAlign: "center",
    marginTop: 7,
  },
});

export default styles;
