import { io } from "socket.io-client";

const socket = io("https://pn9v04b7-3001.asse.devtunnels.ms/", {
  transports: ["websocket"],
});

export default socket;