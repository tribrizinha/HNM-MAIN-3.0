const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// CONFIGURAÇÃO DE SENHA (HASH SEGURO)
// =====================================================
const ADMIN_PASSWORD_HASH = '$2b$10$rKvqQxH5LW5KF.YxJ4WXEO8mYB3p5EqX7xGNVhF3qWLxVvKZBHxJa'; // senha: hnm170720

// Para gerar nova senha use:
// console.log(bcrypt.hashSync('sua_senha_aqui', 10));

const MONGO_URI = "mongodb+srv://tribridzinha17072010:ana17072010@tribridzinha17072010.n9itw5i.mongodb.net/?appName=Tribridzinha17072010";

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO SEGURO (APENAS SENHA)
// =====================================================
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // Verificar se tem header de autorização
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Senha necessária' });
    }

    const password = authHeader.substring(7); // Remove "Bearer "

    if (await bcrypt.compare(password, ADMIN_PASSWORD_HASH)) {
        return next();
    }

    res.status(401).json({ success: false, message: 'Senha incorreta' });
};

// =====================================================
// BANCO DE DADOS
// =====================================================
const playerSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, default: "Desconhecido" },
    data: Object,
    lastSeen: { type: Date, default: Date.now },
    firstSeen: { type: Date, default: Date.now }
});

const Player = mongoose.model('Player', playerSchema);

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Conectado ao MongoDB"))
    .catch(err => console.error("❌ Erro MongoDB:", err));

// =====================================================
// PAINEL VISUAL PREMIUM
// =====================================================
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>HNM Panel | Dashboard</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
                    color: #e0e0e0;
                    min-height: 100vh;
                    padding: 20px;
                    position: relative;
                    overflow-x: hidden;
                }

                body::before {
                    content: '';
                    position: fixed;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(0,255,136,0.03) 1px, transparent 1px);
                    background-size: 50px 50px;
                    animation: gridMove 20s linear infinite;
                    pointer-events: none;
                }

                @keyframes gridMove {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(50px, 50px); }
                }

                .login-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.3s ease;
                }

                .login-box {
                    background: rgba(20, 20, 20, 0.9);
                    border: 1px solid rgba(0,255,136,0.3);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                    animation: slideUp 0.5s ease;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
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

                .input-group {
                    margin-bottom: 20px;
                }

                .input-label {
                    display: block;
                    color: #00ff88;
                    font-size: 13px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .password-input {
                    width: 100%;
                    padding: 15px 20px;
                    background: rgba(30, 30, 30, 0.8);
                    border: 2px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    color: #fff;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    font-family: 'Courier New', monospace;
                }

                .password-input:focus {
                    outline: none;
                    border-color: #00ff88;
                    box-shadow: 0 0 20px rgba(0,255,136,0.2);
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
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .login-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(0,255,136,0.4);
                }

                .login-btn:active {
                    transform: translateY(0);
                }

                .error-message {
                    background: rgba(255, 50, 50, 0.2);
                    border: 1px solid rgba(255, 50, 50, 0.5);
                    color: #ff5555;
                    padding: 12px;
                    border-radius: 8px;
                    margin-top: 15px;
                    font-size: 13px;
                    text-align: center;
                    display: none;
                }

                .error-message.show {
                    display: block;
                    animation: shake 0.5s ease;
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    position: relative;
                    z-index: 1;
                    display: none;
                }

                .container.show {
                    display: block;
                }

                .header {
                    background: rgba(20, 20, 20, 0.8);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(0,255,136,0.2);
                    border-radius: 20px;
                    padding: 30px;
                    margin-bottom: 30px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    animation: slideDown 0.6s ease;
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                h1 {
                    font-size: 36px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #00ff88, #00cc6a);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(0,255,136,0.1);
                    border: 1px solid #00ff88;
                    padding: 8px 20px;
                    border-radius: 50px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #00ff88;
                    box-shadow: 0 0 20px rgba(0,255,136,0.2);
                }

                .pulse {
                    width: 8px;
                    height: 8px;
                    background: #00ff88;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }

                .logout-btn {
                    background: rgba(255, 50, 50, 0.2);
                    border: 1px solid rgba(255, 50, 50, 0.5);
                    color: #ff5555;
                    padding: 8px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    margin-left: auto;
                }

                .logout-btn:hover {
                    background: rgba(255, 50, 50, 0.3);
                    transform: translateY(-2px);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .stat-card {
                    background: rgba(20, 20, 20, 0.6);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 15px;
                    padding: 20px;
                    transition: all 0.3s ease;
                    animation: fadeIn 0.6s ease backwards;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }

                .stat-card:nth-child(1) { animation-delay: 0.1s; }
                .stat-card:nth-child(2) { animation-delay: 0.2s; }
                .stat-card:nth-child(3) { animation-delay: 0.3s; }

                .stat-card:hover {
                    transform: translateY(-5px);
                    border-color: #00ff88;
                    box-shadow: 0 10px 30px rgba(0,255,136,0.2);
                }

                .stat-value {
                    font-size: 32px;
                    font-weight: 700;
                    color: #00ff88;
                    margin-bottom: 5px;
                }

                .stat-label {
                    font-size: 13px;
                    color: #888;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .players-section {
                    background: rgba(20, 20, 20, 0.6);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px;
                    padding: 30px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    animation: slideUp 0.6s ease 0.3s backwards;
                }

                .section-title {
                    font-size: 20px;
                    font-weight: 600;
                    margin-bottom: 20px;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .player-list {
                    display: grid;
                    gap: 15px;
                }

                .player-item {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.3s ease;
                    animation: fadeIn 0.4s ease backwards;
                }

                .player-item:hover {
                    background: rgba(40, 40, 40, 0.8);
                    border-color: rgba(0,255,136,0.3);
                    transform: translateX(5px);
                }

                .player-info {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .player-name {
                    font-size: 16px;
                    font-weight: 600;
                    color: #fff;
                }

                .player-id {
                    font-size: 12px;
                    color: #666;
                    font-family: 'Courier New', monospace;
                }

                .player-status {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .status-tag {
                    padding: 6px 16px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .status-tag.online {
                    background: linear-gradient(135deg, #00ff88, #00cc6a);
                    color: #000;
                    box-shadow: 0 0 15px rgba(0,255,136,0.4);
                }

                .status-tag.offline {
                    background: rgba(100, 100, 100, 0.3);
                    color: #666;
                    border: 1px solid rgba(100,100,100,0.3);
                }

                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }

                .spinner {
                    border: 3px solid rgba(0,255,136,0.1);
                    border-top: 3px solid #00ff88;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    h1 { font-size: 28px; }
                    .stats-grid { grid-template-columns: 1fr; }
                    .player-item { flex-direction: column; align-items: flex-start; gap: 15px; }
                }
            </style>
        </head>
        <body>
            <div class="login-overlay" id="loginOverlay">
                <div class="login-box">
                    <div class="login-title">🔐 HNM Panel</div>
                    <div class="login-subtitle">Digite a senha para acessar</div>
                    <form id="loginForm">
                        <div class="input-group">
                            <label class="input-label">Senha de Acesso</label>
                            <input 
                                type="password" 
                                id="passwordInput" 
                                class="password-input" 
                                placeholder="••••••••"
                                autocomplete="current-password"
                                required
                            >
                        </div>
                        <button type="submit" class="login-btn">Entrar</button>
                        <div class="error-message" id="errorMessage">Senha incorreta!</div>
                    </form>
                </div>
            </div>

            <div class="container" id="dashboard">
                <div class="header">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                        <div>
                            <h1>
                                🔐 HNM Dashboard
                                <div class="status-badge">
                                    <div class="pulse"></div>
                                    SISTEMA ATIVO
                                </div>
                            </h1>
                            <p style="color: #888; margin-top: 10px;">Painel administrativo protegido</p>
                        </div>
                        <button class="logout-btn" onclick="logout()">🚪 Sair</button>
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
                    <div class="section-title">
                        👥 Lista de Jogadores
                    </div>
                    <div id="playerList" class="player-list">
                        <div class="loading">
                            <div class="spinner"></div>
                            Carregando jogadores...
                        </div>
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
                            headers: { 'Authorization': 'Bearer ' + password }
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
                        console.error('Erro no login:', error);
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
                            headers: { 'Authorization': 'Bearer ' + savedPassword }
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
                            list.innerHTML = '<div class="loading">Nenhum jogador registrado ainda.</div>';
                            return;
                        }

                        list.innerHTML = players.map((player, index) => {
                            const isOnline = (Date.now() - new Date(player.lastSeen).getTime()) < 60000;
                            const lastSeen = new Date(player.lastSeen).toLocaleString('pt-BR');
                            
                            return \`
                                <div class="player-item" style="animation-delay: \${index * 0.05}s">
                                    <div class="player-info">
                                        <div class="player-name">\${player.username || 'Desconhecido'}</div>
                                        <div class="player-id">ID: \${player.userId}</div>
                                        <div class="player-id">Última atividade: \${lastSeen}</div>
                                    </div>
                                    <div class="player-status">
                                        <span class="status-tag \${isOnline ? 'online' : 'offline'}">
                                            \${isOnline ? '● ONLINE' : '○ OFFLINE'}
                                        </span>
                                    </div>
                                </div>
                            \`;
                        }).join('');
                    } catch (error) {
                        console.error('Erro ao carregar jogadores:', error);
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// =====================================================
// ROTAS DE DADOS (ROBLOX)
// =====================================================
app.post('/addPlayerData', async (req, res) => {
    const { userId, username, data } = req.body;
    
    try {
        await Player.findOneAndUpdate(
            { userId }, 
            { 
                username, 
                data, 
                lastSeen: Date.now() 
            }, 
            { 
                upsert: true,
                setDefaultsOnInsert: true
            }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao adicionar player:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/getOrFetchPlayerData', async (req, res) => {
    const userId = req.query.userId;
    
    try {
        const player = await Player.findOne({ userId });
        
        if (!player) {
            return res.status(404).json({ 
                success: false, 
                message: 'Jogador não encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            data: { Data: player.data } 
        });
    } catch (error) {
        console.error('Erro ao buscar player:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================================
// LISTA PROTEGIDA DE JOGADORES
// =====================================================
app.get('/listPlayers', authMiddleware, async (req, res) => {
    try {
        const players = await Player.find()
            .select('userId username lastSeen firstSeen')
            .sort({ lastSeen: -1 });
        
        res.json({ success: true, players });
    } catch (error) {
        console.error('Erro ao listar players:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================
app.listen(PORT, () => {
    console.log('═══════════════════════════════════════');
    console.log('🚀 SERVIDOR HNM INICIADO');
    console.log('═══════════════════════════════════════');
    console.log(`📡 Porta: ${PORT}`);
    console.log(`🔐 Sistema de autenticação: ATIVO (Senha)`);
    console.log(`🔑 Senha atual: hnm170720`);
    console.log('═══════════════════════════════════════');
});
