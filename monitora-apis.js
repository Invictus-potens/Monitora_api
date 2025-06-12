const mysql = require('mysql2/promise');

let pool; // Module-level variable to store the pool

function init(p) { // Function to initialize with the pool from server.js
    pool = p;
}

// 🔎 Busca todas as APIs no banco MySQL
async function buscarApisNoBanco() {
  if (!pool) {
    throw new Error("Database pool not initialized in monitora-apis.js");
  }
  try {
    const [rows] = await pool.query('SELECT * FROM apis_monitoradas');

    return rows.map(api => {
      let parsedHeaders = {};
      if (api.headers) {
          try {
              parsedHeaders = JSON.parse(api.headers);
          } catch (e) {
              console.error(`[WARN] Malformed JSON in headers for API '${api.name || api.url}'. Error: ${e.message}. Using empty object for headers.`);
              // parsedHeaders is already {}
          }
      }

      let finalBody = undefined;
      if (api.body) {
          try {
              // Validate that api.body is a valid JSON string by attempting to parse it.
              JSON.parse(api.body); 
              // If valid, use the original string, as it's assumed to be the correct JSON string for the request body.
              finalBody = api.body;
          } catch (e) {
              console.error(`[WARN] Malformed JSON in body for API '${api.name || api.url}'. Error: ${e.message}. Body will be undefined.`);
              // finalBody is already undefined
          }
      }

      return {
        name: api.name,
        url: api.url,
        method: api.method,
        headers: parsedHeaders, // Parsed object
        body: finalBody // String, or undefined
      };
    });
  } catch (error) {
    console.error('[ERROR] Failed to fetch APIs from database:', error);
    // Re-throw the error to be handled by the calling function (testarTodasAPIs)
    // This ensures that testarTodasAPIs knows that fetching APIs failed.
    throw error; 
  }
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

module.exports = { testarTodasAPIs, init }; // Modified exports
