import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5", // Soft Light Cool Grey
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F2C59", // Royal Navy Blue
    letterSpacing: -0.5,
  },

  nearestButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#0F2C59",
    shadowColor: "#0F2C59",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  nearestButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 16,
  },

  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  workshopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F0F4F8",
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
    fontSize: 16,
    fontWeight: "700",
    color: "#1A202C",
  },

  cardAddress: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 3,
  },

  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },

  cardHours: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },

  inactiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FED7D7",
  },

  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#E53E3E",
  },

  bookingButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#0F2C59",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F2C59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  bookingButtonDisabled: {
    backgroundColor: "#E2E8F0",
    shadowOpacity: 0,
    elevation: 0,
  },

  bookingButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  pageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  pageButtonDisabled: {
    backgroundColor: "#EDF2F7",
    borderColor: "#E2E8F0",
    shadowOpacity: 0,
    elevation: 0,
  },

  pageButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F2C59",
  },

  pageButtonTextDisabled: {
    color: "#A0AEC0",
  },

  pageIndicator: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },

  errorText: {
    fontSize: 14,
    color: "#E53E3E",
    textAlign: "center",
    fontWeight: "500",
  },

  emptyText: {
    fontSize: 14,
    color: "#8A94A6",
    textAlign: "center",
    fontWeight: "500",
  },
});

export default styles;