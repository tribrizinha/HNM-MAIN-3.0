const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Banco de dados em memória (os dados ficam salvos enquanto o servidor estiver ligado)
let playerDatabase = {};

// Página inicial
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Heroes Data Transfer</title>
            <style>
                body { font-family: Arial; padding: 20px; background: #f0f0f0; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
                h1 { color: #333; }
                input, textarea, button { width: 100%; padding: 10px; margin: 10px 0; font-size: 16px; }
                button { background: #4CAF50; color: white; border: none; cursor: pointer; }
                button:hover { background: #45a049; }
                .success { color: green; }
                .error { color: red; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎮 Heroes Data Transfer API</h1>
                <p>Use este painel para adicionar dados de jogadores.</p>
                
                <h2>Adicionar Dados de Jogador</h2>
                <form id="addForm">
                    <label>User ID do Roblox:</label>
                    <input type="text" id="userId" placeholder="Ex: 123456789" required>
                    
                    <label>Coins:</label>
                    <input type="number" id="coins" placeholder="Ex: 5000" required>
                    
                    <label>Level:</label>
                    <input type="number" id="level" placeholder="Ex: 10" required>
                    
                    <label>Dados Extras (JSON - opcional):</label>
                    <textarea id="extraData" rows="5" placeholder='{"Inventory": [], "Wins": 0}'></textarea>
                    
                    <button type="submit">Adicionar Jogador</button>
                </form>
                <div id="message"></div>
                
                <h2>Jogadores Cadastrados</h2>
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
                    
                    let data = {
                        Coins: coins,
                        Level: level,
                        HasTransferred: false
                    };
                    
                    if (extraData.trim()) {
                        try {
                            const extra = JSON.parse(extraData);
                            data = { ...data, ...extra };
                        } catch (e) {
                            alert('Erro no JSON dos dados extras!');
                            return;
                        }
                    }
                    
                    const response = await fetch('/addPlayerData', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, data })
                    });
                    
                    const result = await response.json();
                    const msg = document.getElementById('message');
                    
                    if (result.success) {
                        msg.innerHTML = '<p class="success">✅ Jogador adicionado com sucesso!</p>';
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
                    
                    if (result.players.length === 0) {
                        list.innerHTML = '<p>Nenhum jogador cadastrado ainda.</p>';
                    } else {
                        list.innerHTML = '<ul>' + result.players.map(p => 
                            '<li><strong>User ID:</strong> ' + p + '</li>'
                        ).join('') + '</ul>';
                    }
                }
                
                loadPlayers();
            </script>
        </body>
        </html>
    `);
});

// Endpoint que o Roblox vai usar
app.get('/getOrFetchPlayerData', (req, res) => {
    try {
        const userId = req.query.userId;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: "userId is required"
            });
        }

        const playerData = playerDatabase[userId];
        
        if (!playerData) {
            return res.status(404).json({
                success: false,
                error: "Player data not found"
            });
        }
        
        res.json({
            success: true,
            data: {
                Data: playerData
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Adicionar dados de jogador
app.post('/addPlayerData', (req, res) => {
    try {
        const { userId, data } = req.body;
        
        if (!userId || !data) {
            return res.status(400).json({
                success: false,
                error: "userId and data are required"
            });
        }
        
        playerDatabase[userId] = data;
        
        res.json({
            success: true,
            message: "Player data added successfully"
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Listar todos os jogadores
app.get('/listPlayers', (req, res) => {
    res.json({
        success: true,
        players: Object.keys(playerDatabase)
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```