import { StyleSheet } from "react-native";

const CARD_RADIUS = 20;
const IMAGE_WIDTH = 118;

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

  // ---------------------------------------------------------
  // Search bar
  // ---------------------------------------------------------
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  searchWrapperFocused: {
    borderColor: "#0F2C59",
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1A202C",
    padding: 0,
  },

  // ---------------------------------------------------------
  // List / Card
  // ---------------------------------------------------------
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 16,
  },

  card: {
    padding: 0,
    overflow: "hidden",
    borderRadius: CARD_RADIUS,
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  cardImage: {
    width: IMAGE_WIDTH,
    alignSelf: "stretch",
    backgroundColor: "#EAF0FA",
  },

  cardImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  cardImageOverlay: {
    position: "absolute",
    left: 10,
    top: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(229, 62, 62, 0.92)",
  },

  cardImageOverlayText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  cardInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 6,
  },

  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A202C",
  },

  cardMetaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },

  cardAddress: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },

  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  cardHours: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },

  cardChevron: {
    alignSelf: "center",
    marginRight: 10,
  },

  // ---------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------
  skeletonBox: {
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
  },

  skeletonLineTitle: {
    height: 14,
    width: "60%",
    borderRadius: 6,
  },

  skeletonLineAddress: {
    height: 11,
    width: "85%",
    borderRadius: 6,
  },

  skeletonLineHours: {
    height: 11,
    width: "40%",
    borderRadius: 6,
  },

  skeletonFooterLoader: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // ---------------------------------------------------------
  // Empty / error state
  // ---------------------------------------------------------
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },

  stateIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
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