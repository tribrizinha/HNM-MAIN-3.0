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

// Blacklist de PlaceIds
const BlacklistPlaceIds = [
    "" // IDs dos places que não devem salvar
];

// Middleware para verificar blacklist
const checkBlacklist = (req, res, next) => {
    const placeId = req.headers['x-place-id'] || req.body.placeId;
    
    if (placeId && BlacklistPlaceIds.includes(placeId.toString())) {
        return res.status(403).json({ 
            success: false, 
            message: 'Este Place está na blacklist e não pode salvar dados' 
        });
    }
    
    next();
};

// Schema
const playerSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: { type: String, default: "Desconhecido" },
    thumbnailUrl: { type: String, default: "" },
    data: Object,
    lastSeen: { type: Date, default: Date.now },
    firstSeen: { type: Date, default: Date.now },
    blacklisted: { type: Boolean, default: false },
    manuallyAdded: { type: Boolean, default: false }, // Flag para perfis adicionados manualmente
    transferCompleted: { type: Boolean, default: false } // Flag para indicar se já fez a transferência
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
            gap: 20px;
        }
        .player-main {
            display: flex;
            align-items: center;
            gap: 15px;
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
        .player-actions {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-shrink: 0;
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
        .delete-btn {
            background: rgba(255, 50, 50, 0.3);
            border: 2px solid rgba(255, 50, 50, 0.6);
            color: #ff6666;
            padding: 10px 18px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 700;
            transition: all 0.3s;
            white-space: nowrap;
        }
        .delete-btn:hover {
            background: rgba(255, 50, 50, 0.5);
            border-color: #ff5555;
            color: #fff;
        }
        .edit-btn {
            background: rgba(0, 150, 255, 0.3);
            border: 2px solid rgba(0, 150, 255, 0.6);
            color: #66b3ff;
            padding: 10px 18px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 700;
            transition: all 0.3s;
            white-space: nowrap;
        }
        .edit-btn:hover {
            background: rgba(0, 150, 255, 0.5);
            border-color: #66b3ff;
            color: #fff;
        }
        .edit-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            overflow-y: auto;
        }
        .edit-modal.show {
            display: flex;
        }
        .edit-box {
            background: rgba(20, 20, 20, 0.95);
            border: 1px solid rgba(0, 255, 136, 0.5);
            border-radius: 15px;
            padding: 30px;
            max-width: 600px;
            width: 90%;
            margin: 20px;
            max-height: 90vh;
            overflow-y: auto;
        }
        .edit-title {
            font-size: 24px;
            font-weight: 700;
            color: #00ff88;
            margin-bottom: 20px;
        }
        .edit-section {
            margin-bottom: 25px;
        }
        .edit-label {
            color: #888;
            font-size: 14px;
            margin-bottom: 8px;
            display: block;
            font-weight: 600;
        }
        .edit-input {
            width: 100%;
            padding: 12px 15px;
            background: rgba(30, 30, 30, 0.8);
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            color: #fff;
            font-size: 15px;
            font-family: 'Courier New', monospace;
        }
        .edit-input:focus {
            outline: none;
            border-color: #00ff88;
        }
        .edit-textarea {
            min-height: 200px;
            resize: vertical;
        }
        .edit-actions {
            display: flex;
            gap: 10px;
            margin-top: 25px;
        }
        .edit-action-btn {
            flex: 1;
            padding: 14px;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
        }
        .edit-action-btn.cancel {
            background: rgba(255,255,255,0.1);
            color: #fff;
        }
        .edit-action-btn.save {
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            color: #000;
        }
        .blacklist-btn {
            background: rgba(255, 150, 0, 0.3);
            border: 2px solid rgba(255, 150, 0, 0.6);
            color: #ffaa44;
            padding: 10px 18px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 700;
            transition: all 0.3s;
            white-space: nowrap;
        }
        .blacklist-btn:hover {
            background: rgba(255, 150, 0, 0.5);
            border-color: #ffaa44;
            color: #fff;
        }
        .blacklist-btn.active {
            background: rgba(255, 50, 50, 0.4);
            border-color: #ff5555;
            color: #ff5555;
        }
        .player-item.blacklisted {
            opacity: 0.6;
            border-left-color: #ff5555;
        }
        .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-top: 25px;
        }
        .pagination-btn {
            background: rgba(30, 30, 30, 0.8);
            border: 1px solid rgba(255,255,255,0.1);
            color: #fff;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s;
        }
        .pagination-btn:hover:not(:disabled) {
            background: rgba(0, 255, 136, 0.2);
            border-color: #00ff88;
        }
        .pagination-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
        .pagination-info {
            color: #888;
            font-size: 14px;
        }
        .loading {
            text-align: center;
            padding: 50px;
            color: #666;
        }
        .confirm-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        .confirm-modal.show {
            display: flex;
        }
        .confirm-box {
            background: rgba(20, 20, 20, 0.95);
            border: 1px solid rgba(255, 50, 50, 0.5);
            border-radius: 15px;
            padding: 30px;
            max-width: 400px;
            width: 90%;
        }
        .confirm-title {
            font-size: 20px;
            font-weight: 700;
            color: #ff5555;
            margin-bottom: 15px;
        }
        .confirm-text {
            color: #ccc;
            margin-bottom: 25px;
            line-height: 1.5;
        }
        .confirm-actions {
            display: flex;
            gap: 10px;
        }
        .confirm-btn {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }
        .confirm-btn.cancel {
            background: rgba(255,255,255,0.1);
            color: #fff;
        }
        .confirm-btn.delete {
            background: linear-gradient(135deg, #ff4444, #cc0000);
            color: #fff;
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

    <div class="edit-modal" id="editModal">
        <div class="edit-box">
            <div class="edit-title">✏️ Editar Jogador</div>
            <div class="edit-section">
                <label class="edit-label">Jogador</label>
                <input type="text" id="editPlayerName" class="edit-input" readonly>
            </div>
            <div class="edit-section">
                <label class="edit-label">Coins</label>
                <input type="number" id="editCoins" class="edit-input" placeholder="0">
            </div>
            <div class="edit-section">
                <label class="edit-label">Characters (JSON Array)</label>
                <textarea id="editCharacters" class="edit-input edit-textarea" placeholder='["Character1", "Character2"]'></textarea>
            </div>
            <div class="edit-actions">
                <button class="edit-action-btn cancel" onclick="closeEditModal()">Cancelar</button>
                <button class="edit-action-btn save" onclick="savePlayerData()">Salvar</button>
            </div>
        </div>
    </div>

    <div class="confirm-modal" id="confirmModal">
        <div class="confirm-box">
            <div class="confirm-title">⚠️ Confirmar Exclusão</div>
            <div class="confirm-text" id="confirmText">Tem certeza que deseja deletar este jogador?</div>
            <div class="confirm-actions">
                <button class="confirm-btn cancel" onclick="closeConfirmModal()">Cancelar</button>
                <button class="confirm-btn delete" onclick="confirmDelete()">Deletar</button>
            </div>
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

        <div class="players-section" style="margin-bottom: 30px;">
            <div class="section-title">➕ Adicionar Jogador</div>
            <div style="background: rgba(30, 30, 30, 0.6); border: 1px solid rgba(0,255,136,0.2); border-radius: 12px; padding: 25px;">
                <div class="edit-section">
                    <label class="edit-label">User ID do Roblox</label>
                    <input type="text" id="addUserId" class="edit-input" placeholder="Ex: 123456789">
                </div>
                <div class="edit-section">
                    <label class="edit-label">Coins</label>
                    <input type="number" id="addCoins" class="edit-input" placeholder="0" value="0">
                </div>
                <div class="edit-section">
                    <label class="edit-label">Characters (JSON Array)</label>
                    <textarea id="addCharacters" class="edit-input edit-textarea" placeholder='["Character1", "Character2"]'>[]</textarea>
                </div>
                <button class="edit-action-btn save" style="width: 100%;" onclick="addNewPlayer()">
                    ➕ Adicionar Jogador
                </button>
            </div>
        </div>

        <div class="players-section">
            <div class="section-title">👥 Jogadores Registrados</div>
            <div id="playerList" class="player-list">
                <div class="loading">Carregando...</div>
            </div>
            <div class="pagination">
                <button class="pagination-btn" id="prevBtn" onclick="prevPage()" disabled>← Anterior</button>
                <span class="pagination-info" id="pageInfo">Página 1</span>
                <button class="pagination-btn" id="nextBtn" onclick="nextPage()" disabled>Próxima →</button>
            </div>
        </div>
    </div>

    <script>
        let savedPassword = sessionStorage.getItem('hnmPassword');
        let currentPage = 1;
        const playersPerPage = 10;
        let allPlayers = [];
        let playerToDelete = null;
        let playerToEdit = null;

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
                allPlayers = data.players || [];
                
                const onlinePlayers = allPlayers.filter(p => 
                    (Date.now() - new Date(p.lastSeen).getTime()) < 60000
                );
                
                document.getElementById('totalPlayers').textContent = allPlayers.length;
                document.getElementById('onlinePlayers').textContent = onlinePlayers.length;
                document.getElementById('offlinePlayers').textContent = allPlayers.length - onlinePlayers.length;

                renderPlayers();
            } catch (error) {
                console.error('Erro:', error);
            }
        }

        function renderPlayers() {
            const list = document.getElementById('playerList');
            
            if (allPlayers.length === 0) {
                list.innerHTML = '<div class="loading">Nenhum jogador registrado.</div>';
                updatePagination();
                return;
            }

            const startIndex = (currentPage - 1) * playersPerPage;
            const endIndex = startIndex + playersPerPage;
            const playersToShow = allPlayers.slice(startIndex, endIndex);

            list.innerHTML = playersToShow.map((player) => {
                const isOnline = (Date.now() - new Date(player.lastSeen).getTime()) < 60000;
                const isBlacklisted = player.blacklisted || false;
                
                return \`
                    <div class="player-item \${isBlacklisted ? 'blacklisted' : ''}">
                        <div class="player-main">
                            <div>
                                <div class="player-name">
                                    \${player.username}
                                    \${isBlacklisted ? '<span style="color: #ff5555; font-size: 12px; margin-left: 8px;">🚫 BLOQUEADO</span>' : ''}
                                </div>
                                <div class="player-id">ID: \${player.userId}</div>
                            </div>
                        </div>
                        <div class="player-actions">
                            <span class="status-tag \${isOnline ? 'online' : 'offline'}">
                                \${isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                            <button class="blacklist-btn \${isBlacklisted ? 'active' : ''}" onclick="toggleBlacklist('\${player.userId}', '\${player.username}', \${isBlacklisted})">
                                \${isBlacklisted ? '✓ Desbloquear' : '🚫 Bloquear'}
                            </button>
                            <button class="edit-btn" onclick="openEditModal('\${player.userId}', '\${player.username}', \${isBlacklisted})">
                                ✏️ Editar
                            </button>
                            <button class="delete-btn" onclick="openConfirmModal('\${player.userId}', '\${player.username}')">
                                🗑️ Deletar
                            </button>
                        </div>
                    </div>
                \`;
            }).join('');

            updatePagination();
        }

        function updatePagination() {
            const totalPages = Math.ceil(allPlayers.length / playersPerPage);
            
            document.getElementById('prevBtn').disabled = currentPage === 1;
            document.getElementById('nextBtn').disabled = currentPage >= totalPages || totalPages === 0;
            
            if (totalPages === 0) {
                document.getElementById('pageInfo').textContent = 'Sem jogadores';
            } else {
                document.getElementById('pageInfo').textContent = \`Página \${currentPage} de \${totalPages}\`;
            }
        }

        function nextPage() {
            const totalPages = Math.ceil(allPlayers.length / playersPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderPlayers();
            }
        }

        function prevPage() {
            if (currentPage > 1) {
                currentPage--;
                renderPlayers();
            }
        }

        function openConfirmModal(userId, username) {
            playerToDelete = userId;
            document.getElementById('confirmText').textContent = 
                \`Tem certeza que deseja deletar o jogador "\${username}" (ID: \${userId})? Esta ação não pode ser desfeita.\`;
            document.getElementById('confirmModal').classList.add('show');
        }

        function closeConfirmModal() {
            playerToDelete = null;
            document.getElementById('confirmModal').classList.remove('show');
        }

        async function openEditModal(userId, username, isBlacklisted) {
            if (isBlacklisted) {
                alert('Este jogador está bloqueado e não pode ser editado. Desbloqueie-o primeiro.');
                return;
            }
            
            playerToEdit = userId;
            
            try {
                const response = await fetch(\`/getOrFetchPlayerData?userId=\${userId}\`, {
                    headers: { 'x-password': savedPassword }
                });

                if (!response.ok) {
                    alert('Erro ao carregar dados do jogador');
                    return;
                }

                const result = await response.json();
                const playerData = result.data?.Data || {};
                
                document.getElementById('editPlayerName').value = \`\${username} (ID: \${userId})\`;
                document.getElementById('editCoins').value = playerData.Coins || 0;
                document.getElementById('editCharacters').value = JSON.stringify(playerData.Characters || [], null, 2);
                
                document.getElementById('editModal').classList.add('show');
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao carregar dados do jogador');
            }
        }

        async function toggleBlacklist(userId, username, currentStatus) {
            const action = currentStatus ? 'desbloquear' : 'bloquear';
            const confirm = window.confirm(\`Tem certeza que deseja \${action} o jogador "\${username}"?\n\n\${!currentStatus ? 'ATENÇÃO: Jogadores bloqueados não poderão atualizar seus dados do jogo!' : 'O jogador poderá voltar a atualizar dados normalmente.'}\`);
            
            if (!confirm) return;

            try {
                const response = await fetch(\`/toggleBlacklist/\${userId}\`, {
                    method: 'POST',
                    headers: { 'x-password': savedPassword }
                });

                if (response.ok) {
                    const result = await response.json();
                    alert(result.message);
                    await loadPlayers();
                    renderPlayers();
                } else {
                    alert('Erro ao atualizar status da blacklist');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao atualizar status da blacklist');
            }
        }

        function closeEditModal() {
            playerToEdit = null;
            document.getElementById('editModal').classList.remove('show');
        }

        async function savePlayerData() {
            if (!playerToEdit || !savedPassword) return;

            try {
                const coins = parseInt(document.getElementById('editCoins').value) || 0;
                const charactersText = document.getElementById('editCharacters').value.trim();
                
                let characters;
                try {
                    characters = charactersText ? JSON.parse(charactersText) : [];
                    if (!Array.isArray(characters)) {
                        alert('Characters deve ser um array JSON válido!');
                        return;
                    }
                } catch (e) {
                    alert('Erro ao processar Characters: JSON inválido!');
                    return;
                }

                // Buscar dados atuais
                const getResponse = await fetch(\`/getOrFetchPlayerData?userId=\${playerToEdit}\`, {
                    headers: { 'x-password': savedPassword }
                });
                
                const currentData = await getResponse.json();
                const playerData = currentData.data?.Data || {};
                
                // Atualizar apenas Characters e Coins
                playerData.Characters = characters;
                playerData.Coins = coins;

                // Salvar
                const response = await fetch('/updatePlayerData', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-password': savedPassword
                    },
                    body: JSON.stringify({
                        userId: playerToEdit,
                        data: playerData
                    })
                });

                if (response.ok) {
                    closeEditModal();
                    alert('Dados salvos com sucesso!');
                    await loadPlayers();
                } else {
                    alert('Erro ao salvar dados');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao salvar dados do jogador');
            }
        }

        async function addNewPlayer() {
            if (!savedPassword) return;

            const userId = document.getElementById('addUserId').value.trim();
            const coins = parseInt(document.getElementById('addCoins').value) || 0;
            const charactersText = document.getElementById('addCharacters').value.trim();

            if (!userId) {
                alert('Por favor, digite o User ID do Roblox!');
                return;
            }

            let characters;
            try {
                characters = charactersText ? JSON.parse(charactersText) : [];
                if (!Array.isArray(characters)) {
                    alert('Characters deve ser um array JSON válido!');
                    return;
                }
            } catch (e) {
                alert('Erro ao processar Characters: JSON inválido!');
                return;
            }

            try {
                // Buscar username do Roblox
                let username = "Desconhecido";
                try {
                    const userResponse = await fetch(\`https://users.roblox.com/v1/users/\${userId}\`);
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        username = userData.name || "Desconhecido";
                    }
                } catch (e) {
                    console.log('Não foi possível buscar username');
                }

                // Criar estrutura completa do profile
                const fullData = {
                    Characters: characters,
                    Favorited: [],
                    FavoritedCharacters: [],
                    Coins: coins,
                    ActiveBoost: 0,
                    LastTransferCheck: null,
                    LastJoinTime: null,
                    RedeemedCodes: [],
                    RedeemedCompensation: [],
                    RedeemedStarterCoins: false,
                    HnmNewera2: false,
                    QuestCollections: {
                        Crowns: 0,
                        PrincessCrowns: 0,
                        ZeusBolts: 0,
                        MadisonSkulls: 0,
                        LokiRose: 0,
                        DJCoins: 0,
                        HarryUltronKills: 0,
                        FortuneTellerUltronKills: 0,
                        KingKills: 0,
                        ArcherKills: 0,
                        JavelinKills: 0,
                        BeeCrowns: 0,
                        Pyramids: 0,
                    }
                };

                const response = await fetch('/addPlayerData', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-password': savedPassword
                    },
                    body: JSON.stringify({
                        userId: userId,
                        username: username,
                        data: fullData,
                        manuallyAdded: true
                    })
                });

                if (response.ok) {
                    // Marcar como adicionado manualmente no banco
                    await fetch(\`/setManualFlag/\${userId}\`, {
                        method: 'POST',
                        headers: { 'x-password': savedPassword }
                    });
                    
                    alert(\`Jogador \${username} adicionado com sucesso!\\n\\nIMPORTANTE: Os dados deste jogador estão PROTEGIDOS até que ele faça a transferência no jogo.\`);
                    document.getElementById('addUserId').value = '';
                    document.getElementById('addCoins').value = '0';
                    document.getElementById('addCharacters').value = '[]';
                    await loadPlayers();
                    currentPage = 1;
                    renderPlayers();
                } else {
                    alert('Erro ao adicionar jogador');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao adicionar jogador');
            }
        }

        async function confirmDelete() {
            if (!playerToDelete || !savedPassword) return;

            try {
                const response = await fetch(\`/deletePlayer/\${playerToDelete}\`, {
                    method: 'DELETE',
                    headers: { 'x-password': savedPassword }
                });

                if (response.ok) {
                    closeConfirmModal();
                    await loadPlayers();
                    
                    // Ajustar página se necessário
                    const totalPages = Math.ceil(allPlayers.length / playersPerPage);
                    if (currentPage > totalPages && currentPage > 1) {
                        currentPage = totalPages;
                    }
                    renderPlayers();
                } else {
                    alert('Erro ao deletar jogador');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao deletar jogador');
            }
        }
    </script>
</body>
</html>`);
});

// Rotas
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
        res.json({ 
            success: true, 
            data: { Data: player.data },
            manuallyAdded: player.manuallyAdded || false,
            transferCompleted: player.transferCompleted || false
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/addPlayerData', checkBlacklist, async (req, res) => {
    const { userId, username, data, transferCompleted } = req.body;
    
    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId obrigatório' });
    }
    
    try {
        console.log(`\n📤 [addPlayerData] Recebido para: ${userId}`);
        
        // 🟢 GARANTIR QUE DATA TEM ESTRUTURA CORRETA
        const safeData = {
            Characters: Array.isArray(data?.Characters) ? data.Characters : [],
            Coins: typeof data?.Coins === 'number' ? data.Coins : 0,
            Kills: typeof data?.Kills === 'number' ? data.Kills : 0,
            RedeemedCodes: Array.isArray(data?.RedeemedCodes) ? data.RedeemedCodes : [],
            QuestCollections: {
                Crowns: 0,
                PrincessCrowns: 0,
                ZeusBolts: 0,
                MadisonSkulls: 0,
                LokiRose: 0,
                DJCoins: 0,
                HarryUltronKills: 0,
                FortuneTellerUltronKills: 0,
                KingKills: 0,
                ArcherKills: 0,
                JavelinKills: 0,
                BeeCrowns: 0,
                Pyramids: 0,
                TechCoins: 0,
            },
            FavoritedCharacters: Array.isArray(data?.FavoritedCharacters) ? data.FavoritedCharacters : [],
            Favorited: Array.isArray(data?.Favorited) ? data.Favorited : [],
            ActiveBoost: 0,
            LastTransferCheck: null,
            LastJoinTime: null,
            RedeemedCompensation: [],
            RedeemedStarterCoins: false,
            HnmNewera2: false,
        };

        const thumbnailUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`;
        
        const updateData = { 
            username: username || 'Desconhecido', 
            thumbnailUrl, 
            data: safeData,
            lastSeen: new Date(),
            transferCompleted: transferCompleted === true,
            blacklisted: false
        };
        
        console.log(`💾 Salvando ${safeData.Characters.length} personagens...`);
        
        const result = await Player.findOneAndUpdate(
            { userId }, 
            updateData, 
            { 
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );
        
        if (!result) {
            console.error(`❌ Falha ao salvar para ${userId}`);
            return res.status(500).json({ 
                success: false, 
                message: 'Falha ao salvar dados' 
            });
        }
        
        console.log(`✅ Salvo com sucesso! ${safeData.Characters.length} personagens`);
        
        res.json({ 
            success: true,
            saved: true,
            characterCount: safeData.Characters.length
        });
        
    } catch (error) {
        console.error(`❌ ERRO em /addPlayerData:`, error.message);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// 🆕 ENDPOINT PARA RESETAR TRANSFER AUTOMATICAMENTE
app.post('/resetTransferAuto/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const player = await Player.findOne({ userId });
        
        if (!player) {
            return res.status(404).json({ 
                success: false, 
                message: 'Jogador não encontrado' 
            });
        }
        
        // Remove a flag de transferência completa
        await Player.findOneAndUpdate(
            { userId },
            { transferCompleted: false }
        );
        
        console.log(`🔄 Transfer resetada automaticamente para ${userId}`);
        
        res.json({ 
            success: true, 
            message: 'Transfer resetada para novo envio' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/listPlayers', authMiddleware, async (req, res) => {
    try {
        const players = await Player.find()
            .select('userId username thumbnailUrl lastSeen blacklisted')
            .sort({ lastSeen: -1 });
        res.json({ success: true, players });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/deletePlayer/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await Player.findOneAndDelete({ userId });
        
        if (!result) {
            return res.status(404).json({ success: false, message: 'Jogador não encontrado' });
        }
        
        res.json({ success: true, message: 'Jogador deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/updatePlayerData', authMiddleware, async (req, res) => {
    const { userId, data } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId obrigatório' });
    }
    try {
        // Verificar se o jogador está na blacklist
        const existingPlayer = await Player.findOne({ userId });
        if (existingPlayer && existingPlayer.blacklisted) {
            return res.status(403).json({ 
                success: false, 
                message: 'Este jogador está na blacklist e não pode ter dados atualizados' 
            });
        }
        
        await Player.findOneAndUpdate(
            { userId },
            { data, lastSeen: Date.now() },
            { upsert: false }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/toggleBlacklist/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const player = await Player.findOne({ userId });
        
        if (!player) {
            return res.status(404).json({ success: false, message: 'Jogador não encontrado' });
        }
        
        const newBlacklistStatus = !player.blacklisted;
        await Player.findOneAndUpdate(
            { userId },
            { blacklisted: newBlacklistStatus }
        );
        
        res.json({ 
            success: true, 
            blacklisted: newBlacklistStatus,
            message: newBlacklistStatus ? 'Jogador adicionado à blacklist' : 'Jogador removido da blacklist'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/setManualFlag/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        await Player.findOneAndUpdate(
            { userId },
            { manuallyAdded: true, transferCompleted: false }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/completeTransfer/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Deletar o jogador do banco após transferência completada
        const result = await Player.findOneAndDelete({ userId });
        
        if (!result) {
            return res.status(404).json({ success: false, message: 'Jogador não encontrado' });
        }
        
        res.json({ 
            success: true, 
            message: 'Transferência completa. Jogador removido do servidor.'
        });
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

