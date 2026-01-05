const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' })); // Aumentado para suportar tabelas grandes de personagens

// Banco de dados em memória
let playerDatabase = {};

// Página inicial com Painel de Controle
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Heroes Data Transfer - Panel</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f4f7f6; color: #333; }
                .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                h2 { color: #34495e; margin-top: 30px; }
                input, textarea, button { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
                textarea { font-family: monospace; background: #fdfdfd; }
                button { background: #3498db; color: white; border: none; cursor: pointer; font-weight: bold; transition: background 0.3s; }
                button:hover { background: #2980b9; }
                .success { color: #27ae60; background: #e8f6ef; padding: 10px; border-radius: 5px; font-weight: bold; }
                .error { color: #c0392b; background: #f9ebea; padding: 10px; border-radius: 5px; font-weight: bold; }
                ul { list-style: none; padding: 0; }
                li { background: #fff; margin: 8px 0; padding: 15px; border-radius: 8px; border-left: 5px solid #3498db; box-shadow: 0 2px 5px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; }
                .id-label { font-weight: bold; color: #2c3e50; }
                .stats { font-size: 12px; color: #7f8c8d; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎮 HNM - Transfer System</h1>
                <p>Os jogadores que entrarem no jogo serão registrados aqui automaticamente.</p>
                
                <h2>Adicionar/Editar Manualmente</h2>
                <form id="addForm">
                    <input type="text" id="userId" placeholder="Roblox User ID (ex: 705255178)" required>
                    <textarea id="fullData" rows="6" placeholder='Cole o JSON completo aqui ou apenas o básico:
{
  "Coins": 50000,
  "Characters": ["HarryWizard"],
  "HasTransferred": false
}'></textarea>
                    <button type="submit">Salvar no Banco de Dados</button>
                </form>
                <div id="message"></div>
                
                <h2>Jogadores Registrados (Backup)</h2>
                <button onclick="loadPlayers()" style="background: #95a5a6;">🔄 Atualizar Lista</button>
                <div id="playerList"></div>
            </div>
            
            <script>
                document.getElementById('addForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const userId = document.getElementById('userId').value;
                    const fullDataRaw = document.getElementById('fullData').value;
                    
                    let data;
                    try {
                        data = JSON.parse(fullDataRaw);
                    } catch (err) {
                        alert('Erro: O campo de dados precisa ser um JSON válido!');
                        return;
                    }
                    
                    const response = await fetch('/addPlayerData', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, data })
                    });
                    
                    const result = await response.json();
                    const msg = document.getElementById('message');
                    if (result.success) {
                        msg.innerHTML = '<p class="success">✅ Dados salvos com sucesso para o ID ' + userId + '!</p>';
                        loadPlayers();
                    } else {
                        msg.innerHTML = '<p class="error">❌ Erro ao salvar: ' + result.error + '</p>';
                    }
                });
                
                async function loadPlayers() {
                    const response = await fetch('/listPlayers');
                    const result = await response.json();
                    const list = document.getElementById('playerList');
                    
                    if (Object.keys(result.players).length === 0) {
                        list.innerHTML = '<p style="text-align:center; color:#999;">Nenhum jogador registrado ainda.</p>';
                        return;
                    }

                    list.innerHTML = '<ul>' + Object.keys(result.players).map(id => {
                        const p = result.players[id];
                        return '<li>' + 
                               '<div><span class="id-label">ID: ' + id + '</span><br>' +
                               '<span class="stats">Coins: ' + (p.Coins || 0) + ' | Personagens: ' + (p.Characters ? p.Characters.length : 0) + '</span></div>' +
                               '</li>';
                    }).join('') + '</ul>';
                }
                loadPlayers();
            </script>
        </body>
        </html>
    `);
});

// Endpoint de Busca (Chamado pelo Roblox TransferService)
app.get('/getOrFetchPlayerData', (req, res) => {
    const userId = req.query.userId;
    const playerData = playerDatabase[userId];
    
    if (!userId || !playerData) {
        return res.status(404).json({ success: false, error: "Player not found" });
    }
    
    console.log(`Roblox solicitou dados do ID: ${userId}`);
    res.json({ success: true, data: { Data: playerData } });
});

// Endpoint de Cadastro (Chamado pelo Roblox DataService ou pelo Painel)
app.post('/addPlayerData', (req, res) => {
    const { userId, data } = req.body;
    if (!userId || !data) return res.status(400).json({ success: false, error: "Missing userId or data" });
    
    playerDatabase[userId] = data;
    console.log(`Backup realizado para o ID: ${userId}`);
    res.json({ success: true });
});

// Listagem Completa para o Painel
app.get('/listPlayers', (req, res) => {
    res.json({ success: true, players: playerDatabase });
});

app.listen(PORT, () => console.log(`Servidor Heroes rodando na porta ${PORT}`));

