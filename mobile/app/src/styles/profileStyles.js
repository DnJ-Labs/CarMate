import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F7FB",
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
    textAlign: "center",
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
    paddingVertical: 5,
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
    letterSpacing: 0.6,
    marginBottom: 5,
  },

  value: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
  },

  arrow: {
    fontSize: 24,
    color: "#A0A5B1",
    marginLeft: 10,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 25,
    marginBottom: 10,
    marginLeft: 3,
  },

  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
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

  logoutButton: {
    alignItems: "center",
    paddingVertical: 20,
    marginTop: 15,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#E05252",
  },
});

export default styles;
