import { io } from "socket.io-client";

const socket = io("https://c9k836ch-3001.asse.devtunnels.ms/");

socket.on("connect", () => {
  console.log("SOCKET CONNECTED:", socket.id);
});

socket.on("connect_error", (error) => {
  console.log("SOCKET ERROR:", error.message);
});

socket.on("disconnect", () => {
  console.log("SOCKET DISCONNECTED");
});

// BOOKING STATUS

socket.on("booking:status", (data) => {
  console.log("BOOKING STATUS UPDATE:", data);
});

export default socket;