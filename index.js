const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// DEFINA SUA SENHA AQUI:
const SITE_PASS = "hnm123"; 

const MONGO_URI = "mongodb+srv://tribridzinha17072010:ana17072010@tribridzinha17072010.n9itw5i.mongodb.net/?appName=Tribridzinha17072010";

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Middleware de autenticação apenas por senha
const authMiddleware = (req, res, next) => {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    // Aceita qualquer usuário, desde que a senha esteja correta
    if (password === SITE_PASS) {
        return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Acesso Restrito"');
    res.status(401).send('Acesso negado. Digite a senha.');
};

// Banco de Dados
const playerSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, default: "Desconhecido" },
    data: Object,
    lastSeen: { type: Date, default: Date.now }
});

const Player = mongoose.model('Player', playerSchema);

mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado ao MongoDB! ✅"))
    .catch(err => console.error("Erro MongoDB:", err));

// Painel Visual Protegido
app.get('/', authMiddleware, (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Painel HNM - Privado</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 40px; background: #0a0a0a; color: white; text-align: center; }
                .card { background: #141414; padding: 25px; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.8); max-width: 600px; margin: auto; border: 1px solid #222; }
                h1 { color: #00ff88; text-shadow: 0 0 10px rgba(0,255,136,0.3); }
                .status-server { padding: 5px 15px; border-radius: 50px; background: #1b5e20; font-size: 11px; display: inline-block; margin-bottom: 25px; border: 1px solid #00ff88; }
                .player-item { background: #1d1d1d; margin: 10px 0; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
                .nick { font-weight: bold; color: #fff; font-size: 16px; }
                .id { color: #666; font-size: 12px; }
                .tag { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; }
                .on { background: #00ff88; color: #000; box-shadow: 0 0 10px #00ff88; }
                .off { background: #333; color: #888; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🔐 Painel Administrativo</h1>
                <div class="status-server">ACESSO RESTRITO</div>
                <div id="list">Carregando lista...</div>
            </div>
            <script>
                async function load() {
                    try {
                        const r = await fetch('/listPlayers', {
                            headers: { 'Authorization': 'Basic ' + btoa(':' + '${SITE_PASS}') }
                        });
                        const d = await r.json();
                        const list = document.getElementById('list');
                        list.innerHTML = d.players.map(p => {
                            const isOnline = (Date.now() - new Date(p.lastSeen).getTime()) < 60000;
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
                    } catch (e) { console.log(e); }
                }
                load();
                setInterval(load, 5000);
            </script>
        </body>
        </html>
    `);
});

// Rotas de Dados (Roblox)
app.post('/addPlayerData', async (req, res) => {
    const { userId, username, data } = req.body;
    try {
        await Player.findOneAndUpdate({ userId }, { username, data, lastSeen: Date.now() }, { upsert: true });
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

// Lista Protegida
app.get('/listPlayers', authMiddleware, async (req, res) => {
    const players = await Player.find().select('userId username lastSeen').sort({ lastSeen: -1 });
    res.json({ success: true, players });
});

app.listen(PORT, () => console.log("Servidor Protegido Rodando!"));
