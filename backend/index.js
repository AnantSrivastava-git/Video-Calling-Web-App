const { Server } = require("socket.io");
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const http = require("http");
const cors = require("cors")
const app = express();
const Groq = require("groq-sdk")

app.use(cors({
    origin: "*", // In production, replace with your specific URL
    methods: ["GET", "POST"]
}));

const server = http.createServer(app);
const groq = new Groq({ apiKey: "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" });
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.set("socketio", io);

const storage = multer.diskStorage({
    destination: (req, file, cb) =>
        cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        // the original name sent by the frontend
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    }
});

const upload = multer({ storage: storage });

app.post("/api/transcribe", upload.single("audio"), async (req, res) => {

    if (!req.file) {
        return res.status(400).json({ message: "No file incomming to the server" });
    }

    try {
        const { roomCode, socket_id } = req.body;
        const socketio = req.app.get("socketio");
        console.log("Stream recived by the server");

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(req.file.path),
            model: "whisper-large-v3-turbo",
            language: "en",
            temperature: 0,
            response_format: "verbose_json",
        });

        const text = transcription.text;
        // console.log(`Transcription ---> ${text}`);

        // const text = "hello from server";

        if (text.trim() !== "") {
            socketio.to(roomCode).emit("Recieve-Captions", { text });
        }

        // Cleanup temp file
        fs.unlinkSync(req.file.path);
        res.status(200).json("Transcription Well Recieved");
    }
    catch (err) {
        console.error("Transcription Error " + err);
        if (err.status === 429) {
            console.log("Yeah you reached the limit for the key");
        }
        res.status(500).json({ message: "Sorry Internal Server error" });
    }
})


const EmailtoSocketId = new Map();
const SocketIdtoEmail = new Map();

io.on("connection", (socket) => {
    console.log(`Socket Connection made > Id: ${socket.id}`);

    socket.on("join-room", data => {
        const { name, email, roomCode, peerId } = data;
        EmailtoSocketId.set(email, socket.id);
        SocketIdtoEmail.set(socket.id, email);
        socket.join(roomCode);
        socket.to(roomCode).emit("user-connected", { email: email, name: name, id: peerId, socket_id: socket.id });
        socket.emit("join-room", data);
    });

    socket.on("send captions", data => {
        const { roomCode, text } = data;
        socket.broadcast.to(roomCode).emit('recieve captions', { text })
    })
});

server.listen(8000, () => (console.log('Server running at port: 8000')));
