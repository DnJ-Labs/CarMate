import { StyleSheet } from "react-native";

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#6B7280",
  },

  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  notificationContent: {
    flex: 1,
  },

  notificationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  notificationMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4B5563",
  },

  notificationDate: {
    marginTop: 10,
    fontSize: 12,
    color: "#9CA3AF",
  },

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    marginTop: 10,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
