require("dotenv").config();
const { Server } = require("socket.io");
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const http = require("http");
const cors = require("cors")
const app = express();
const Groq = require("groq-sdk")
const PORT = process.env.PORT || 8000;

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const roomTranscripts = new Map();

roomTranscripts.set("123",["Good morning everyone thanks for joining.",
"So today we are discussing the deployment of the video calling application."
,
"Frontend is already deployed on vercel and backend is currently running on render."
,
"The main issue right now is the TURN server because users on different networks are not able to connect."
,
"We are considering using a free TURN provider or deploying coturn later."
,
"For captions we are using whisper large v3 turbo through groq api.",
"Accuracy is not perfect but it works for demonstration."
,
"Another feature we added is meeting summarization which will run only after the meeting ends."
,
"This way we avoid too many LLM requests during the call."
,
"Action item: test summarization route with large transcript and make sure memory usage is stable."
,
"Okay let's continue development and meet tomorrow with updates."])

app.use(express.json());
app.use(cors({
    origin: "*", // In production, replace with your specific URL
    methods: ["GET", "POST"]
}));

const server = http.createServer(app);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
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
        cb(null, uploadsDir),
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

        if (text.trim() !== "") {

            /////////////////////////////////////

            // sets the transcripts in the Map via roomCode key ---------

            if (!roomTranscripts.has(roomCode)) {
                roomTranscripts.set(roomCode, [])
            }

            roomTranscripts.get(roomCode).push(text);

            /////////////////////////////////////

            socketio.to(roomCode).emit("Recieve-Captions", { text });
        }

        res.status(200).json("Transcription Well Recieved");
    }
    catch (err) {
        console.error("Transcription Error " + err);
        if (err.status === 429) {
            console.log("Yeah you reached the limit for the key");
        }
        res.status(500).json({ message: "Sorry Internal Server error" });
    }
    finally {

        // ALWAYS DELETE FILE
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("File deletion failed:", err);
            });
        }
    }
})


app.post("/api/summarize", async (req, res) => {
    const { roomCode } = req.body
    console.log(roomCode);

    if (!roomTranscripts.has(roomCode)) {
        console.log("Room does not exist.")
        return res.json({ Message: "Error: Entered Wrong room code." });
    }

    const transcription = roomTranscripts.get(roomCode) || [];

    if (!transcription.length) {
        console.log("Room Transcription does not exist.")
        return res.json({ Message: "Error: No data to generate summary." });
    }

    console.log("Transcripts Collection Successfull\n");

    const finalTranscript = transcription.join("\n").slice(0, 120000);

    try {
        const completion = await groq.chat.completions.create({
            messages: [{
                role: "system",
                content: `You are an AI meeting assistant.
                        Analyze the transcript and produce:

                        1. Meeting Summary
                        2. Key Discussion Points
                        3. Decisions Made
                        4. Action Items
                        
                        Be Concise and Structured`
            },
            {
                role: "user",
                content: finalTranscript
            }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            max_completion_tokens: 700,
            top_p: 0.9,
            stream: false
        })

        console.log("Summary Generation Successfull sending from the server.");
        return res.json({ summary: completion.choices[0].message.content });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error : in generating summary" })
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


setInterval(() => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) return console.error("Uploads read error:", err);
        for (const file of files) {
            const filePath = path.join(uploadsDir, file);
            fs.unlink(filePath, (err) => {
                if (err) console.error("Cleanup delete error:", err);
            });
        }
    });
}, 2 * 60 * 1000); // every 2 minutes

server.listen(PORT, () => (console.log(`Server running at port: ${PORT}`)));
