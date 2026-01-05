const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = "mongodb+srv://tribridzinha17072010:ana17072010@tribridzinha17072010.n9itw5i.mongodb.net/?appName=Tribridzinha17072010";

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Banco de Dados atualizado para incluir Nick e Status
const playerSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, default: "Desconhecido" }, // Nick do jogador
    data: Object,
    lastSeen: { type: Date, default: Date.now } // Para saber se está Online
});

const Player = mongoose.model('Player', playerSchema);

mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado ao MongoDB! ✅"))
    .catch(err => console.error("Erro MongoDB:", err));

// Painel Visual com Nick e Status On/Off
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>HNM Transfer System</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 40px; background: #0f0f0f; color: white; text-align: center; }
                .card { background: #1a1a1a; padding: 25px; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.7); max-width: 600px; margin: auto; border: 1px solid #333; }
                h1 { color: #00ff88; margin-bottom: 5px; }
                .status-server { padding: 5px 15px; border-radius: 50px; background: #2e7d32; font-size: 12px; display: inline-block; margin-bottom: 25px; }
                .player-item { background: #262626; margin: 10px 0; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid #00ff88; }
                .nick { font-weight: bold; color: #fff; font-size: 16px; }
                .id { color: #888; font-size: 12px; }
                .tag { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
                .on { background: #00ff88; color: #000; }
                .off { background: #ff4444; color: #fff; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🎮 Heroes: New Multiverse</h1>
                <div class="status-server">SISTEMA DE TRANSFERÊNCIA ATIVO</div>
                <div id="list">Carregando jogadores...</div>
            </div>
            <script>
                async function load() {
                    try {
                        const r = await fetch('/listPlayers');
                        const d = await r.json();
                        const list = document.getElementById('list');
                        
                        if (d.players.length === 0) {
                            list.innerHTML = '<p style="color: #666;">Nenhum jogador registrado.</p>';
                            return;
                        }

                        list.innerHTML = d.players.map(p => {
                            const isOnline = (Date.now() - new Date(p.lastSeen).getTime()) < 60000; // Online se atualizou nos últimos 60s
                            return \`
                                <div class="player-item">
                                    <div style="text-align: left">
                                        <div class="nick">\${p.username}</div>
                                        <div class="id">ID: \${p.userId}</div>
                                    </div>
                                    <span class="tag \${isOnline ? 'on' : 'off'}">\${isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                                </div>
                            \`;
                        }).join('');
                    } catch (e) { document.getElementById('list').innerHTML = "Erro ao carregar."; }
                }
                load();
                setInterval(load, 5000); // Atualiza a lista a cada 5 segundos
            </script>
        </body>
        </html>
    `);
});

// Roblox envia: { "userId": "123", "username": "Player1", "data": {...} }
app.post('/addPlayerData', async (req, res) => {
    const { userId, username, data } = req.body;
    try {
        await Player.findOneAndUpdate(
            { userId }, 
            { username, data, lastSeen: Date.now() }, 
            { upsert: true }
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.get('/getOrFetchPlayerData', async (req, res) => {
    const userId = req.query.userId;
    try {
        const p = await Player.findOne({ userId });
        if (!p) return res.status(404).json({ success: false });
        res.json({ success: true, data: { Data: p.data } });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.get('/listPlayers', async (req, res) => {
    const players = await Player.find().select('userId username lastSeen').sort({ lastSeen: -1 });
    res.json({ success: true, players });
});

app.listen(PORT, () => console.log("Servidor rodando!"));
