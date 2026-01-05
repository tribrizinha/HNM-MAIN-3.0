const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// Senha de acesso
const ACCESS_PASSWORD = "hnm170720";

// MongoDB
const MONGO_URI = "mongodb+srv://tribridzinha17072010:ana17072010@tribridzinha17072010.n9itw5i.mongodb.net/?appName=Tribridzinha17072010";

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
    const password = req.headers['x-password'] || req.query.password;
    if (password === ACCESS_PASSWORD) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Senha incorreta' });
};

// Schema
const playerSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, default: "Desconhecido" },
    thumbnailUrl: { type: String, default: "" },
    data: Object,
    lastSeen: { type: Date, default: Date.now },
    firstSeen: { type: Date, default: Date.now }
});

const Player = mongoose.model('Player', playerSchema);

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB conectado"))
    .catch(err => console.error("Erro MongoDB:", err));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Painel
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HNM Transfer System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            color: #e0e0e0;
            min-height: 100vh;
            padding: 20px;
        }
        .login-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        .login-box {
            background: rgba(20, 20, 20, 0.9);
            border: 1px solid rgba(0,255,136,0.3);
            border-radius: 20px;
            padding: 40px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8);
        }
        .login-title {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
            text-align: center;
        }
        .login-subtitle {
            color: #888;
            text-align: center;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .password-input {
            width: 100%;
            padding: 15px 20px;
            background: rgba(30, 30, 30, 0.8);
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            color: #fff;
            font-size: 16px;
            margin-bottom: 20px;
        }
        .password-input:focus {
            outline: none;
            border-color: #00ff88;
        }
        .login-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            border: none;
            border-radius: 12px;
            color: #000;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
        }
        .error-message {
            background: rgba(255, 50, 50, 0.2);
            border: 1px solid rgba(255, 50, 50, 0.5);
            color: #ff5555;
            padding: 12px;
            border-radius: 8px;
            margin-top: 15px;
            text-align: center;
            display: none;
        }
        .error-message.show { display: block; }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            display: none;
        }
        .container.show { display: block; }
        .header {
            background: rgba(20, 20, 20, 0.8);
            border: 1px solid rgba(0,255,136,0.2);
            border-radius: 20px;
            padding: 35px;
            margin-bottom: 30px;
        }
        h1 {
            font-size: 38px;
            font-weight: 700;
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .logout-btn {
            background: rgba(255, 50, 50, 0.2);
            border: 1px solid rgba(255, 50, 50, 0.5);
            color: #ff5555;
            padding: 8px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            border: none;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(20, 20, 20, 0.6);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 25px;
        }
        .stat-value {
            font-size: 36px;
            font-weight: 700;
            color: #00ff88;
            margin-bottom: 8px;
        }
        .stat-label {
            font-size: 13px;
            color: #888;
            text-transform: uppercase;
        }
        .players-section {
            background: rgba(20, 20, 20, 0.6);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 30px;
        }
        .section-title {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 25px;
            color: #fff;
        }
        .player-list {
            display: grid;
            gap: 15px;
        }
        .player-item {
            background: rgba(30, 30, 30, 0.8);
            border: 1px solid rgba(255,255,255,0.05);
            border-left: 4px solid #00ff88;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .player-main {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .player-avatar {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            border: 2px solid rgba(0,255,136,0.3);
            object-fit: cover;
        }
        .player-name {
            font-size: 17px;
            font-weight: 600;
            color: #fff;
        }
        .player-id {
            font-size: 12px;
            color: #666;
        }
        .status-tag {
            padding: 8px 18px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .status-tag.online {
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            color: #000;
        }
        .status-tag.offline {
            background: rgba(255, 68, 68, 0.2);
            color: #ff4444;
            border: 1px solid rgba(255, 68, 68, 0.3);
        }
        .loading {
            text-align: center;
            padding: 50px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="login-overlay" id="loginOverlay">
        <div class="login-box">
            <div class="login-title">🔐 HNM Panel</div>
            <div class="login-subtitle">Digite a senha para acessar</div>
            <form id="loginForm">
                <input type="password" id="passwordInput" class="password-input" placeholder="Senha" required>
                <button type="submit" class="login-btn">Entrar</button>
                <div class="error-message" id="errorMessage">Senha incorreta!</div>
            </form>
        </div>
    </div>

    <div class="container" id="dashboard">
        <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h1>🎮 Heroes: New Multiverse</h1>
                <button class="logout-btn" onclick="logout()">Sair</button>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="totalPlayers">0</div>
                <div class="stat-label">Total de Jogadores</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="onlinePlayers">0</div>
                <div class="stat-label">Online Agora</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="offlinePlayers">0</div>
                <div class="stat-label">Offline</div>
            </div>
        </div>

        <div class="players-section">
            <div class="section-title">👥 Jogadores Registrados</div>
            <div id="playerList" class="player-list">
                <div class="loading">Carregando...</div>
            </div>
        </div>
    </div>

    <script>
        let savedPassword = sessionStorage.getItem('hnmPassword');

        if (savedPassword) {
            verifyAndLogin(savedPassword);
        }

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('passwordInput').value;
            await verifyAndLogin(password);
        });

        async function verifyAndLogin(password) {
            try {
                const response = await fetch('/listPlayers', {
                    headers: { 'x-password': password }
                });

                if (response.ok) {
                    sessionStorage.setItem('hnmPassword', password);
                    savedPassword = password;
                    document.getElementById('loginOverlay').style.display = 'none';
                    document.getElementById('dashboard').classList.add('show');
                    loadPlayers();
                    setInterval(loadPlayers, 5000);
                } else {
                    document.getElementById('errorMessage').classList.add('show');
                    setTimeout(() => {
                        document.getElementById('errorMessage').classList.remove('show');
                    }, 3000);
                }
            } catch (error) {
                console.error('Erro:', error);
            }
        }

        function logout() {
            sessionStorage.removeItem('hnmPassword');
            location.reload();
        }

        async function loadPlayers() {
            if (!savedPassword) return;

            try {
                const response = await fetch('/listPlayers', {
                    headers: { 'x-password': savedPassword }
                });

                if (!response.ok) {
                    logout();
                    return;
                }

                const data = await response.json();
                const players = data.players || [];
                
                const onlinePlayers = players.filter(p => 
                    (Date.now() - new Date(p.lastSeen).getTime()) < 60000
                );
                
                document.getElementById('totalPlayers').textContent = players.length;
                document.getElementById('onlinePlayers').textContent = onlinePlayers.length;
                document.getElementById('offlinePlayers').textContent = players.length - onlinePlayers.length;

                const list = document.getElementById('playerList');
                
                if (players.length === 0) {
                    list.innerHTML = '<div class="loading">Nenhum jogador registrado.</div>';
                    return;
                }

                list.innerHTML = players.map((player) => {
                    const isOnline = (Date.now() - new Date(player.lastSeen).getTime()) < 60000;
                    const thumbnailUrl = player.thumbnailUrl || \`https://www.roblox.com/headshot-thumbnail/image?userId=\${player.userId}&width=150&height=150&format=png\`;
                    
                    return \`
                        <div class="player-item">
                            <div class="player-main">
                                <img src="\${thumbnailUrl}" alt="\${player.username}" class="player-avatar">
                                <div>
                                    <div class="player-name">\${player.username}</div>
                                    <div class="player-id">ID: \${player.userId}</div>
                                </div>
                            </div>
                            <span class="status-tag \${isOnline ? 'online' : 'offline'}">
                                \${isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                        </div>
                    \`;
                }).join('');
            } catch (error) {
                console.error('Erro:', error);
            }
        }
    </script>
</body>
</html>`);
});

// Rotas
app.post('/addPlayerData', async (req, res) => {
    const { userId, username, data } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId obrigatório' });
    }
    try {
        const thumbnailUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`;
        await Player.findOneAndUpdate(
            { userId }, 
            { username: username || 'Desconhecido', thumbnailUrl, data, lastSeen: Date.now() }, 
            { upsert: true, setDefaultsOnInsert: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/getOrFetchPlayerData', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId obrigatório' });
    }
    try {
        const player = await Player.findOne({ userId });
        if (!player) {
            return res.status(404).json({ success: false, message: 'Jogador não encontrado' });
        }
        res.json({ success: true, data: { Data: player.data } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/listPlayers', authMiddleware, async (req, res) => {
    try {
        const players = await Player.find()
            .select('userId username thumbnailUrl lastSeen')
            .sort({ lastSeen: -1 });
        res.json({ success: true, players });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('Servidor HNM rodando na porta', PORT);
});

server.on('error', (error) => {
    console.error('Erro:', error);
    process.exit(1);
});
