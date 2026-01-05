const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Banco de dados em memória
let playerDatabase = {};

// Página inicial com Painel de Controle
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Heroes Data Transfer</title>
            <style>
                body { font-family: Arial; padding: 20px; background: #f0f0f0; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                h1 { color: #333; }
                input, textarea, button { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
                button { background: #4CAF50; color: white; border: none; cursor: pointer; font-weight: bold; }
                button:hover { background: #45a049; }
                .success { color: green; font-weight: bold; }
                .error { color: red; font-weight: bold; }
                ul { list-style: none; padding: 0; }
                li { background: #eee; margin: 5px 0; padding: 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎮 Heroes Data Transfer</h1>
                <p>Cadastre os IDs dos jogadores para permitir a transferência.</p>
                
                <h2>Adicionar Jogador</h2>
                <form id="addForm">
                    <input type="text" id="userId" placeholder="User ID do Roblox (ex: 123456)" required>
                    <input type="number" id="coins" placeholder="Quantidade de Coins" required>
                    <input type="number" id="level" placeholder="Level do Jogador" required>
                    <textarea id="extraData" rows="3" placeholder='Dados Extras (JSON): {"Wins": 5}'></textarea>
                    <button type="submit">Adicionar ao Banco de Dados</button>
                </form>
                <div id="message"></div>
                
                <h2>Jogadores na Fila</h2>
                <button onclick="loadPlayers()">Atualizar Lista</button>
                <div id="playerList"></div>
            </div>
            
            <script>
                document.getElementById('addForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const userId = document.getElementById('userId').value;
                    const coins = parseInt(document.getElementById('coins').value);
                    const level = parseInt(document.getElementById('level').value);
                    const extraData = document.getElementById('extraData').value;
                    
                    let data = { Coins: coins, Level: level, HasTransferred: false };
                    if (extraData.trim()) {
                        try { Object.assign(data, JSON.parse(extraData)); } 
                        catch (e) { alert('Erro no JSON extra!'); return; }
                    }
                    
                    const response = await fetch('/addPlayerData', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, data })
                    });
                    
                    const result = await response.json();
                    const msg = document.getElementById('message');
                    if (result.success) {
                        msg.innerHTML = '<p class="success">✅ Adicionado!</p>';
                        document.getElementById('addForm').reset();
                        loadPlayers();
                    } else {
                        msg.innerHTML = '<p class="error">❌ Erro: ' + result.error + '</p>';
                    }
                });
                
                async function loadPlayers() {
                    const response = await fetch('/listPlayers');
                    const result = await response.json();
                    const list = document.getElementById('playerList');
                    list.innerHTML = result.players.length === 0 ? '<p>Vazio</p>' : 
                        '<ul>' + result.players.map(p => '<li>ID: ' + p + '</li>').join('') + '</ul>';
                }
                loadPlayers();
            </script>
        </body>
        </html>
    `);
});

// Endpoint de Busca (Roblox)
app.get('/getOrFetchPlayerData', (req, res) => {
    const userId = req.query.userId;
    const playerData = playerDatabase[userId];
    
    if (!userId || !playerData) {
        return res.status(404).json({ success: false, error: "Player not found" });
    }
    
    res.json({ success: true, data: { Data: playerData } });
});

// Endpoint de Cadastro (Painel)
app.post('/addPlayerData', (req, res) => {
    const { userId, data } = req.body;
    if (!userId || !data) return res.status(400).json({ success: false, error: "Missing data" });
    
    playerDatabase[userId] = data;
    res.json({ success: true });
});

// Listagem
app.get('/listPlayers', (req, res) => {
    res.json({ success: true, players: Object.keys(playerDatabase) });
});

app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
