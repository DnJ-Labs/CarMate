import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },

  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F7FB",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 28,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    marginTop: 16,
  },

  selectBox: {
    minHeight: 58,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },

  lockedSelectBox: {
    backgroundColor: "#F1F2F5",
  },

  selectedTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  selectedSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  placeholder: {
    fontSize: 14,
    color: "#9CA3AF",
  },

  dropdown: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginTop: 6,
    overflow: "hidden",
  },

  option: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  optionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  optionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  emptyText: {
    padding: 16,
    textAlign: "center",
    fontSize: 13,
    color: "#9CA3AF",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
  },

  notesInput: {
    minHeight: 110,
  },

  notesTextInput: {
    flex: 1,
    minHeight: 110,
    padding: 16,
    fontSize: 14,
    color: "#111827",
    textAlignVertical: "top",
  },

  submitButton: {
    marginTop: 28,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#4438F5",
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  submitText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default styles;
