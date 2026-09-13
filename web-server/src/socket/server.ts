import { createServer } from "http";
import { Server } from "socket.io"

const httpServer = createServer()

const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
})

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    socket.on("disconnected", () => {
        console.log("Client disconnected:", socket.id)
    })
})

httpServer.listen(3001, () => {
    console.log("Socket.IO server running on port 3001")
})