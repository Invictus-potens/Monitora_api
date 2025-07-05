const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose(); // 👈 Importa sqlite3
const { testarTodasAPIs, init: initMonitoraAPIs } = require('./monitora-apis'); // Modified import

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// 🔌 Conexão com banco SQLite
const DBSOURCE = "database.sqlite";

const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // Cannot open database
    console.error(err.message);
    throw err;
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS empresas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cnpj TEXT NOT NULL UNIQUE,
      codigo_seguranca TEXT
    )`, (err) => {
      if (err) {
        // Table already created or error
        console.log('Table "empresas" already exists or error creating it.');
      } else {
        // Table just created, creating some rows
        const insert = 'INSERT INTO empresas (nome, cnpj, codigo_seguranca) VALUES (?,?,?)';
        db.run(insert, ["Empresa Exemplo 1", "12345678000100", "seg123"]);
        db.run(insert, ["Empresa Exemplo 2", "98765432000199", "seg456"]);
        console.log('Table "empresas" created and populated with examples.');
      }
    });
  }
});

// Pass the SQLite db instance to monitora-apis;
// Note: monitora-apis.js might need adjustments if it was expecting a MySQL pool.
// For now, we'll pass it, but it might not be used or might cause errors if not adapted.
initMonitoraAPIs(db);

// 📌 Exemplo: rota usando banco (opcional, se quiser salvar logs)
// This route will be updated in a later step to remove MySQL specific code.
app.post('/monitorar', async (req, res) => {
  try {
    const resultados = await testarTodasAPIs();

    // Logging to database has been removed as it was MySQL specific.
    // If SQLite logging is needed, it can be implemented as a separate feature.
    res.status(200).json({
      mensagem: 'Monitoramento executado com sucesso.',
      resultados
    });
  } catch (err) {
    console.error('[ERRO NA ROTA /monitorar]', err);
    res.status(500).json({ erro: err.message });
  }
});

// Rota GET /status
app.get('/status', (req, res) => {
  res.status(200).json({ status: "API is running" });
});

// Rota GET /empresa?cnpj=123
app.get('/empresa', (req, res) => {
  const cnpj = req.query.cnpj;
  if (!cnpj) {
    return res.status(400).json({ error: "CNPJ query parameter is required." });
  }

  const sql = "SELECT * FROM empresas WHERE cnpj = ?";
  db.get(sql, [cnpj], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ message: "Empresa not found." });
    }
  });
});

// Rota GET /empresa/12345678000199 (dynamic route)
app.get('/empresa/:cnpj', (req, res) => {
  const cnpj = req.params.cnpj;
  if (!cnpj) {
    // This case should ideally not be hit if routing is set up correctly,
    // but as a safeguard:
    return res.status(400).json({ error: "CNPJ parameter is required." });
  }

  const sql = "SELECT * FROM empresas WHERE cnpj = ?";
  db.get(sql, [cnpj], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ message: "Empresa not found." });
    }
  });
});

const PORT = 48019;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`✅ Painel disponível em http://${HOST}:${PORT}`);
});
