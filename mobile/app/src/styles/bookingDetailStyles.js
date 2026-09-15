import { StyleSheet } from "react-native";

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F6FA",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F6FA",
    padding: 30,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#172033",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: "#667085",
    textAlign: "center",
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#172033",
    marginBottom: 5,
  },

  bookingCode: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667085",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#172033",
    marginBottom: 14,
  },

  /* BOOKING STATUS */

  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#172033",
  },

  statusPending: {
    backgroundColor: "#FFF4D6",
  },

  statusConfirmed: {
    backgroundColor: "#E8F1FF",
  },

  statusCheckedIn: {
    backgroundColor: "#E9E7FF",
  },

  statusOnProgress: {
    backgroundColor: "#E5F7ED",
  },

  statusDone: {
    backgroundColor: "#DDF7E8",
  },

  statusCancelled: {
    backgroundColor: "#FDE7E7",
  },

  /* PAYMENT */

  paymentDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#667085",
    marginBottom: 14,
  },

  paymentOption: {
    backgroundColor: "#F8F9FC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },

  paymentOptionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#172033",
    marginBottom: 5,
  },

  paymentOptionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: "#667085",
  },

  paymentStatusBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 12,
  },

  paymentStatusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#172033",
  },

  paymentPaid: {
    backgroundColor: "#DDF7E8",
  },

  paymentPending: {
    backgroundColor: "#FFF4D6",
  },

  paymentFailed: {
    backgroundColor: "#FDE7E7",
  },

  paymentNote: {
    fontSize: 13,
    lineHeight: 19,
    color: "#667085",
    backgroundColor: "#F8F9FC",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },

  /* INFO */

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },

  infoLabel: {
    fontSize: 14,
    color: "#667085",
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#172033",
    maxWidth: "62%",
    textAlign: "right",
  },

  /* NOTES */

  notes: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475467",
  },

  /* SERVICES */

  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },

  serviceName: {
    flex: 1,
    fontSize: 14,
    color: "#344054",
    marginRight: 10,
  },

  servicePrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#172033",
  },

  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
    marginTop: 10,
    paddingTop: 14,
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#172033",
  },

  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4F46E5",
  },

  /* PENDING TASKS */

  taskRow: {
    flexDirection: "row",
    marginBottom: 8,
  },

  taskBullet: {
    fontSize: 16,
    marginRight: 8,
    color: "#4F46E5",
  },

  taskText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#475467",
  },

  /* REPORT */

  reportDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#667085",
    marginBottom: 16,
  },

  downloadButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});