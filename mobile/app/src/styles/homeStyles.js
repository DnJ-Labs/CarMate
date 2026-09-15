import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5", // Diganti ke Soft Light Cool Grey agar kartu putih di atasnya terlihat tegas
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

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  addVehicleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F2C59", // Royal Navy Blue
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 4,
    // Soft Shadow
    shadowColor: "#0F2C59",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  addVehicleText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF", // Diberi warna putih bersih
    gap: 10,
    // Soft Shadow
    shadowColor: "#A3B1C6",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1A202C",
    fontWeight: "500",
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 18,
  },

  /* Card Vehicle - Neumorphic / Clean Elevated */
  card: {
    backgroundColor: "#FFFFFF", // Menggunakan Putih Bersih agar kontras dengan background
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0", // Garis tepi tipis agar bentuk kartu makin tegas
    // Soft Outer Shadow untuk pemisahan visual yang jelas
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 160,
    backgroundColor: "#EDF2F7",
  },

  vehicleImage: {
    width: "100%",
    height: "100%",
  },

  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EDF2F7",
  },

  badgeContainer: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F2C59",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  cardBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },

  cardModel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A202C",
  },

  plateTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },

  cardPlate: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },

  cardFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },

  bookButton: {
    backgroundColor: "#0F2C59", // Royal Navy Blue
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F2C59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
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