const mysql = require('mysql2/promise');

// 🔌 Criação do pool (ou exporte o pool do app.js se quiser centralizar)
const pool = mysql.createPool({
  host: '3.143.158.70',
  user: 'felipe.cam',
  password: 'FelcmKrolik16',
  database: 'spotify_db',
  port: 3306,
  waitForConnections: true,
});

// 🔎 Busca todas as APIs no banco MySQL
async function buscarApisNoBanco() {
  const [rows] = await pool.query('SELECT * FROM apis_monitoradas');

  return rows.map(api => ({
    name: api.name,
    url: api.url,
    method: api.method,
    headers: JSON.parse(api.headers || '{}'),
    body: api.body ? JSON.stringify(JSON.parse(api.body)) : undefined
  }));
}

// 🚦 Testa as APIs
async function testarTodasAPIs() {
  const apisParaMonitorar = await buscarApisNoBanco();
  if (!apisParaMonitorar || apisParaMonitorar.length === 0) {
    throw new Error("Nenhuma API para monitorar foi encontrada.");
  }

  const resultados = [];

  console.log(`\n[CHECK] Verificando ${apisParaMonitorar.length} APIs em ${new Date().toLocaleString()}`);

  for (const api of apisParaMonitorar) {
    const start = Date.now();
    try {
      const res = await fetch(api.url, {
        method: api.method,
        headers: api.headers,
        body: api.body
      });

      const tempo = Date.now() - start;
      const status = res.status;

      const resultado = {
        nome: api.name,
        status,
        tempo,
        ok: status >= 200 && status < 300
      };

      resultados.push(resultado);

      if (resultado.ok) {
        console.log(`🟢 ${api.name} | Status: ${status} | Tempo: ${tempo}ms`);
      } else {
        const texto = await res.text();
        console.log(`🔴 ${api.name} | Status: ${status} | Tempo: ${tempo}ms | [ERROR]: ${texto}`);
      }

    } catch (err) {
      console.log(`🔴 ${api.name} | Erro: ${err.message}`);
      resultados.push({
        nome: api.name,
        status: 'erro',
        tempo: null,
        ok: false
      });
    }
  }

  return resultados;
}

module.exports = { testarTodasAPIs };
