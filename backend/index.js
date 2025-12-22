const { Server } = require("socket.io");

const io = new Server(8000, {
    cors: true,
});

const EmailtoSocketId = new Map();
const SocketIdtoEmail = new Map();

io.on("connection", (socket) => {
    console.log(`Socket Connection made\n Id:${socket.id}`);

    socket.on("join-room", data => {
        // console.log(`Name : ${data.name} \t Email : ${data.email} \t Room : ${data.roomcode}`);
        const { name, email, roomCode } = data;
        EmailtoSocketId.set( email, socket.id );
        SocketIdtoEmail.set( socket.id, email );
        io.to(roomCode).emit("user-connected", {email: email, name: name, id: socket.id});
        socket.join(roomCode);
        io.to(socket.id).emit("join-room", data);
    });

    socket.on("user:call", ({ to, offer })=>{
        io.to(to).emit("incomming-call", { from: socket.id, offer });
    });

    socket.on("call:accepted", ({ to, ans})=>{
        io.to(to).emit("call:accepted", { from: socket.id, ans});
    });

    socket.on("peer:nego-needed", ({to , offer})=>{
        io.to(to).emit("peer:nego-needed", { from: socket.id, offer});
    });

    socket.on("peer:nego-done", ({ to, ans })=>{
        io.to(to).emit("peer:nego-final", ({ from: socket.id, ans }))
    });

    socket.on("disconnect", ()=>{
        const email = SocketIdtoEmail.get(socket.id);
        if(email){
            SocketIdtoEmail.delete(socket.id);
            EmailtoSocketId.delete(email);
            console.log("Socket User disconnected : " , socket.id)
        }
    })
})