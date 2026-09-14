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
    fontSize: 27,
    fontWeight: "700",
    color: "#111827",
    marginTop: 25,
  },

  subtitle: {
    fontSize: 14,
    color: "#8A8F9C",
    marginTop: 6,
    marginBottom: 28,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 18,
  },

  selectBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 62,
    justifyContent: "center",
  },

  lockedSelectBox: {
    backgroundColor: "#F0F1F5",
  },

  placeholder: {
    fontSize: 14,
    color: "#A0A5B1",
  },

  selectedTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  selectedSubtitle: {
    fontSize: 12,
    color: "#8A8F9C",
    marginTop: 4,
  },

  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginTop: 6,
    overflow: "hidden",
  },

  option: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F1F4",
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  optionSubtitle: {
    fontSize: 12,
    color: "#8A8F9C",
    marginTop: 4,
  },

  emptyText: {
    padding: 16,
    fontSize: 14,
    color: "#8A8F9C",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#111827",
    minHeight: 52,
  },

  notesInput: {
    height: 110,
    paddingTop: 5,
  },

  notesTextInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    textAlignVertical: "top",
  },

  submitButton: {
    backgroundColor: "#4438F5",
    borderRadius: 16,
    minHeight: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },

  disabledButton: {
    opacity: 0.6,
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default styles;
