const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 3000;

// Configurações
const ADMIN_PASSWORD_HASH = '$2b$10$rKvqQxH5LW5KF.YxJ4WXEO8mYB3p5EqX7xGNVhF3qWLxVvKZBHxJa'; // senha: hnm170720
const MONGO_URI = "mongodb+srv://tribridzinha17072010:ana17072010@tribridzinha17072010.n9itw5i.mongodb.net/?appName=Tribridzinha17072010";

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Middleware de Autenticação
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Senha necessária' });
    }
    const password = authHeader.substring(7);
    const match = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (match) return next();
    res.status(401).json({ success: false, message: 'Senha incorreta' });
};

// Banco de Dados
const playerSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, default: "Desconhecido" },
    data: Object,
    lastSeen: { type: Date, default: Date.now }
});
const Player = mongoose.model('Player', playerSchema);

mongoose.connect(MONGO_URI).then(() => console.log("✅ MongoDB Conectado"));

// Rotas API
app.post('/addPlayerData', async (req, res) => {
    const { userId, username, data } = req.body;
    try {
        await Player.findOneAndUpdate({ userId }, { username, data, lastSeen: Date.now() }, { upsert: true });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.get('/listPlayers', authMiddleware, async (req, res) => {
    try {
        const players = await Player.find().sort({ lastSeen: -1 });
        res.json({ success: true, players });
    } catch (e) { res.status(500).json({ success: false }); }
});

// Página Inicial (Dashboard)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>HNM Panel</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #0a0a0b; color: white; display: flex; justify-content: center; padding: 20px; }
                .container { width: 100%; max-width: 800px; background: #141417; padding: 30px; border-radius: 15px; border: 1px solid #222; }
                .player-card { background: #1c1c21; padding: 15px; margin: 10px 0; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #00ff88; }
                .online { color: #00ff88; font-weight: bold; font-size: 12px; }
                .offline { color: #ff4444; font-size: 12px; }
                input { width: 100%; padding: 12px; margin-bottom: 10px; border-radius: 8px; border: none; background: #25252b; color: white; }
                button { width: 100%; padding: 12px; border-radius: 8px; border: none; background: #00ff88; color: black; font-weight: bold; cursor: pointer; }
                #dashboard { display: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div id="loginSection">
                    <h2>🔐 HNM Login</h2>
                    <input type="password" id="pass" placeholder="Digite a senha admin">
                    <button onclick="login()">Acessar Painel</button>
                </div>
                <div id="dashboard">
                    <h2>👥 Jogadores Registrados</h2>
                    <div id="playerList">Carregando...</div>
                </div>
            </div>
            <script>
                let token = "";
                async function login() {
                    const p = document.getElementById('pass').value;
                    const r = await fetch('/listPlayers', { headers: {'Authorization': 'Bearer ' + p} });
                    if(r.ok) {
                        token = p;
                        document.getElementById('loginSection').style.display = 'none';
                        document.getElementById('dashboard').style.display = 'block';
                        load();
                        setInterval(load, 5000);
                    } else { alert("Senha Incorreta!"); }
                }
                async function load() {
                    const r = await fetch('/listPlayers', { headers: {'Authorization': 'Bearer ' + token} });
                    const d = await r.json();
                    document.getElementById('playerList').innerHTML = d.players.map(p => {
                        const isOnline = (Date.now() - new Date(p.lastSeen).getTime()) < 60000;
                        return \`<div class="player-card">
                            <div><strong>\${p.username}</strong><br><small>ID: \${p.userId}</small></div>
                            <div class="\${isOnline ? 'online' : 'offline'}">\${isOnline ? '● ONLINE' : '○ OFFLINE'}</div>
                        </div>\`;
                    }).join('');
                }
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => console.log("🚀 Servidor rodando na porta " + PORT));
