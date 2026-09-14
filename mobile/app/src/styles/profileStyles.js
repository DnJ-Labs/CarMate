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

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F7FB",
  },

  errorText: {
    fontSize: 15,
    color: "#6B7280",
  },

  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginTop: 25,
  },

  userSection: {
    alignItems: "center",
    marginTop: 45,
    marginBottom: 30,
  },

  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },

  username: {
    fontSize: 15,
    color: "#8A8F9C",
    marginTop: 6,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
  },

  infoContent: {
    flex: 1,
  },

  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 5,
    letterSpacing: 0.5,
  },

  value: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
  },

  arrow: {
    fontSize: 24,
    color: "#A0A5B1",
  },

  menuContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginTop: 18,
    paddingHorizontal: 18,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
  },

  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },

  editButton: {
    backgroundColor: "#4438F5",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 25,
  },

  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  logoutButton: {
    alignItems: "center",
    paddingVertical: 20,
  },

  logoutText: {
    color: "#E05252",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default styles;
