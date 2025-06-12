const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise'); // 👈 importa MySQL com suporte a async/await
const { testarTodasAPIs, init: initMonitoraAPIs } = require('./monitora-apis'); // Modified import

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// 🔌 Conexão com banco MySQL
const pool = mysql.createPool({
  host: '3.143.158.70',
  user: 'felipe.cam',
  password: 'FelcmKrolik16',
  database: 'spotify_db',
  port: 3306,
  waitForConnections: true,
});

initMonitoraAPIs(pool); // Initialize monitora-apis with the pool

// 📌 Exemplo: rota usando banco (opcional, se quiser salvar logs)
app.post('/monitorar', async (req, res) => {
  try {
    const resultados = await testarTodasAPIs();

    // Exemplo: salvar os logs no banco (ajuste conforme estrutura do seu DB)
    const connection = await pool.getConnection();

    for (const resultado of resultados) {
      await connection.query(
        'INSERT INTO logs_monitoramento (api, status, mensagem, timestamp) VALUES (?, ?, ?, NOW())',
        [
          resultado.nome || 'Sem nome',
          resultado.status || 'erro',
          resultado.ok ? 'Sucesso' : 'Falha'
        ]
      );
    }

    connection.release();

    res.status(200).json({
      mensagem: 'Monitoramento executado com sucesso.',
      resultados
    });
  } catch (err) {
    console.error('[ERRO NA ROTA /monitorar]', err);
    res.status(500).json({ erro: err.message });
  }
});

const PORT = 48019;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`✅ Painel disponível em http://${HOST}:${PORT}`);
});
