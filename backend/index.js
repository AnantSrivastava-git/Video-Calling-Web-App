const { Server } = require("socket.io");

const io = new Server(8000, {
    cors: true,
});

const EmailtoSocketId = new Map();
const SocketIdtoEmail = new Map();

io.on("connection", (socket) => {
    console.log(`Socket Connection made\n Id:${socket.id}`);

    socket.on("join-room", data => {
        const { name, email, roomCode, peerId } = data;
        EmailtoSocketId.set( email, socket.id );
        SocketIdtoEmail.set( socket.id, email );
        io.to(roomCode).emit("user-connected", {email: email, name: name, id: peerId});
        socket.join(roomCode);
        io.to(socket.id).emit("join-room", data);
    });

});
