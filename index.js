const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// =====================================================
const MONGO_URI = "mongodb+srv://tribridzinha17072010:ana17072010@tribridzinha17072010.n9itw5i.mongodb.net/?appName=Tribridzinha17072010";

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// =====================================================
// SCHEMA DO BANCO DE DADOS
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
            <title>HNM | Sistema de Transferência</title>
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

                /* Grid animado de fundo */
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
                    z-index: 0;
                }

                @keyframes gridMove {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(50px, 50px); }
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    position: relative;
                    z-index: 1;
                }

                /* Header */
                .header {
                    background: rgba(20, 20, 20, 0.8);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(0,255,136,0.2);
                    border-radius: 20px;
                    padding: 35px;
                    margin-bottom: 30px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    animation: slideDown 0.6s ease;
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                h1 {
                    font-size: 38px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #00ff88, #00cc6a);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    flex-wrap: wrap;
                }

                .subtitle {
                    color: #888;
                    font-size: 15px;
                    margin-top: 8px;
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

                /* Stats Cards */
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
                    padding: 25px;
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
                    font-size: 36px;
                    font-weight: 700;
                    color: #00ff88;
                    margin-bottom: 8px;
                }

                .stat-label {
                    font-size: 13px;
                    color: #888;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                /* Players Section */
                .players-section {
                    background: rgba(20, 20, 20, 0.6);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px;
                    padding: 30px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    animation: slideUp 0.6s ease 0.3s backwards;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .section-title {
                    font-size: 22px;
                    font-weight: 600;
                    margin-bottom: 25px;
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
                    border-left: 4px solid #00ff88;
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
                    border-left-color: #00ff88;
                    border-left-width: 6px;
                    transform: translateX(5px);
                    box-shadow: 0 5px 20px rgba(0,255,136,0.1);
                }

                .player-info {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .player-name {
                    font-size: 17px;
                    font-weight: 600;
                    color: #fff;
                }

                .player-id {
                    font-size: 12px;
                    color: #666;
                    font-family: 'Courier New', monospace;
                }

                .player-meta {
                    font-size: 11px;
                    color: #777;
                }

                .player-status {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 8px;
                }

                .status-tag {
                    padding: 8px 18px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    white-space: nowrap;
                }

                .status-tag.online {
                    background: linear-gradient(135deg, #00ff88, #00cc6a);
                    color: #000;
                    box-shadow: 0 0 15px rgba(0,255,136,0.4);
                }

                .status-tag.offline {
                    background: rgba(255, 68, 68, 0.2);
                    color: #ff4444;
                    border: 1px solid rgba(255, 68, 68, 0.3);
                }

                .status-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: currentColor;
                }

                .online .status-indicator {
                    animation: pulse 2s infinite;
                }

                .loading {
                    text-align: center;
                    padding: 50px;
                    color: #666;
                }

                .spinner {
                    border: 3px solid rgba(0,255,136,0.1);
                    border-top: 3px solid #00ff88;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #666;
                }

                .empty-icon {
                    font-size: 64px;
                    margin-bottom: 15px;
                    opacity: 0.3;
                }

                /* Responsivo */
                @media (max-width: 768px) {
                    h1 { 
                        font-size: 28px; 
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    
                    .stats-grid { 
                        grid-template-columns: 1fr; 
                    }
                    
                    .player-item { 
                        flex-direction: column; 
                        align-items: flex-start; 
                        gap: 15px; 
                    }
                    
                    .player-status {
                        width: 100%;
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                    }
                }

                /* Animação de entrada dos cards */
                .player-item:nth-child(1) { animation-delay: 0.05s; }
                .player-item:nth-child(2) { animation-delay: 0.1s; }
                .player-item:nth-child(3) { animation-delay: 0.15s; }
                .player-item:nth-child(4) { animation-delay: 0.2s; }
                .player-item:nth-child(5) { animation-delay: 0.25s; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>
                        🎮 Heroes: New Multiverse
                        <div class="status-badge">
                            <div class="pulse"></div>
                            SISTEMA ATIVO
                        </div>
                    </h1>
                    <div class="subtitle">Sistema de Transferência de Dados em Tempo Real</div>
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
                        👥 Jogadores Registrados
                    </div>
                    <div id="playerList" class="player-list">
                        <div class="loading">
                            <div class="spinner"></div>
                            <div>Carregando jogadores...</div>
                        </div>
                    </div>
                </div>
            </div>

            <script>
                async function loadPlayers() {
                    try {
                        const response = await fetch('/listPlayers');
                        const data = await response.json();
                        const players = data.players || [];
                        
                        // Atualizar estatísticas
                        const onlinePlayers = players.filter(p => 
                            (Date.now() - new Date(p.lastSeen).getTime()) < 60000
                        );
                        
                        document.getElementById('totalPlayers').textContent = players.length;
                        document.getElementById('onlinePlayers').textContent = onlinePlayers.length;
                        document.getElementById('offlinePlayers').textContent = players.length - onlinePlayers.length;

                        // Renderizar lista
                        const list = document.getElementById('playerList');
                        
                        if (players.length === 0) {
                            list.innerHTML = \`
                                <div class="empty-state">
                                    <div class="empty-icon">🎮</div>
                                    <div>Nenhum jogador registrado ainda.</div>
                                </div>
                            \`;
                            return;
                        }

                        list.innerHTML = players.map((player, index) => {
                            const isOnline = (Date.now() - new Date(player.lastSeen).getTime()) < 60000;
                            const lastSeen = new Date(player.lastSeen).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            
                            return \`
                                <div class="player-item">
                                    <div class="player-info">
                                        <div class="player-name">\${player.username || 'Desconhecido'}</div>
                                        <div class="player-id">ID: \${player.userId}</div>
                                        <div class="player-meta">Última atividade: \${lastSeen}</div>
                                    </div>
                                    <div class="player-status">
                                        <span class="status-tag \${isOnline ? 'online' : 'offline'}">
                                            <span class="status-indicator"></span>
                                            \${isOnline ? 'ONLINE' : 'OFFLINE'}
                                        </span>
                                    </div>
                                </div>
                            \`;
                        }).join('');
                    } catch (error) {
                        console.error('Erro ao carregar jogadores:', error);
                        document.getElementById('playerList').innerHTML = \`
                            <div class="loading" style="color: #ff4444;">
                                ⚠️ Erro ao carregar dados. Tentando novamente...
                            </div>
                        \`;
                    }
                }

                // Carregar imediatamente
                loadPlayers();

                // Atualizar a cada 5 segundos
                setInterval(loadPlayers, 5000);
            </script>
        </body>
        </html>
    `);
});

// =====================================================
// ROTAS DE DADOS (ROBLOX)
// =====================================================

// Adicionar ou atualizar dados de jogador
app.post('/addPlayerData', async (req, res) => {
    const { userId, username, data } = req.body;
    
    if (!userId) {
        return res.status(400).json({ 
            success: false, 
            message: 'userId é obrigatório' 
        });
    }
    
    try {
        await Player.findOneAndUpdate(
            { userId }, 
            { 
                username: username || 'Desconhecido', 
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
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Buscar dados de um jogador específico
app.get('/getOrFetchPlayerData', async (req, res) => {
    const userId = req.query.userId;
    
    if (!userId) {
        return res.status(400).json({ 
            success: false, 
            message: 'userId é obrigatório' 
        });
    }
    
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
        res.status(500).json({ 
            success: false,
            message: error.message
        });
    }
});

// Listar todos os jogadores
app.get('/listPlayers', async (req, res) => {
    try {
        const players = await Player.find()
            .select('userId username lastSeen firstSeen')
            .sort({ lastSeen: -1 });
        
        res.json({ success: true, players });
    } catch (error) {
        console.error('Erro ao listar players:', error);
        res.status(500).json({ 
            success: false,
            message: error.message
        });
    }
});
