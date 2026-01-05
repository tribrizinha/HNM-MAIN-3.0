const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = "mongodb+srv://tribridzinha17072010:<ana17072010>@tribridzinha17072010.n9itw5i.mongodb.net/?appName=Tribridzinha17072010";

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Configuração do Banco de Dados
const playerSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    data: Object,
    updatedAt: { type: Date, default: Date.now }
});

const Player = mongoose.model('Player', playerSchema);

mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado ao MongoDB! ✅"))
    .catch(err => console.error("Erro MongoDB:", err));

// Painel de Controle Visual
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>HNM Transfer System</title>
            <style>
                body { font-family: sans-serif; padding: 40px; background: #121212; color: white; text-align: center; }
                .card { background: #1e1e1e; padding: 20px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); max-width: 500px; margin: auto; }
                h1 { color: #00ff88; }
                .status { padding: 10px; border-radius: 5px; background: #2e7d32; display: inline-block; margin-bottom: 20px; }
                ul { list-style: none; padding: 0; text-align: left; }
                li { background: #333; margin: 5px 0; padding: 10px; border-radius: 5px; border-left: 4px solid #00ff88; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🎮 Heroes: New Multiverse </h1>
                <div class="status">Servidor Online & Protegido</div>
                <h3>Jogadores com Backup:</h3>
                <div id="list">Carregando...</div>
            </div>
            <script>
                async function load() {
                    const r = await fetch('/listPlayers');
                    const d = await r.json();
                    document.getElementById('list').innerHTML = d.players.length === 0 ? 'Nenhum jogador ainda.' : 
                        '<ul>' + d.players.map(p => '<li>👤 ID: ' + p.userId + '</li>').join('') + '</ul>';
                }
                load();
            </script>
        </body>
        </html>
    `);
});

// Rota para o Roblox salvar dados (Auto-Backup)
app.post('/addPlayerData', async (req, res) => {
    const { userId, data } = req.body;
    try {
        await Player.findOneAndUpdate({ userId }, { data, updatedAt: Date.now() }, { upsert: true });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

// Rota para o Roblox ler dados (Transferência)
app.get('/getOrFetchPlayerData', async (req, res) => {
    const userId = req.query.userId;
    try {
        const p = await Player.findOne({ userId });
        if (!p) return res.status(404).json({ success: false });
        res.json({ success: true, data: { Data: p.data } });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.get('/listPlayers', async (req, res) => {
    const players = await Player.find().select('userId');
    res.json({ success: true, players });
});

app.listen(PORT, () => console.log("Servidor rodando!"));



