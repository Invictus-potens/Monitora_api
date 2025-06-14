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

      // For body, we will now return the raw string from the database.
      // testarTodasAPIs will handle parsing or using it as is.
      // If api.body is null or undefined, it will be passed as such.
      const rawBody = api.body;

      return {
        name: api.name,
        url: api.url,
        method: api.method,
        headers: parsedHeaders, // Parsed object
        body: rawBody // Raw string, null, or undefined
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
async function testarTodasAPIs(apiListParam = null) {
  const apisParaMonitorar = Array.isArray(apiListParam) && apiListParam.length > 0
    ? apiListParam
    : await buscarApisNoBanco();

  if (!apisParaMonitorar || apisParaMonitorar.length === 0) {
    // Potentially different error message if apiListParam was provided but empty
    if (Array.isArray(apiListParam) && apiListParam.length === 0) {
        console.warn("[WARN] testarTodasAPIs was called with an empty list.");
        return []; // or throw new Error("Empty API list provided.");
    }
    throw new Error("Nenhuma API para monitorar foi encontrada (nem via parâmetro, nem via banco).");
  }

  const resultados = [];

  console.log(`\n[CHECK] Verificando ${apisParaMonitorar.length} APIs em ${new Date().toLocaleString()}`);

  for (const apiConfig of apisParaMonitorar) {
    const start = Date.now();
    try {
      let finalHeaders = {};
      if (typeof apiConfig.headers === 'string') {
        try {
          finalHeaders = JSON.parse(apiConfig.headers);
        } catch (e) {
          console.warn(`[WARN] Malformed JSON in headers string for API '${apiConfig.name || apiConfig.url}'. Error: ${e.message}. Using empty object for headers.`);
          // finalHeaders remains {}
        }
      } else if (typeof apiConfig.headers === 'object' && apiConfig.headers !== null) {
        finalHeaders = apiConfig.headers;
      }
      // If apiConfig.headers is undefined or not a string/object, finalHeaders remains {}

      let finalBody;
      const contentTypeHeader = finalHeaders['Content-Type'] || finalHeaders['content-type'] || '';

      if (typeof apiConfig.body === 'object' && apiConfig.body !== null) {
        if (contentTypeHeader.includes('application/json')) {
          finalBody = JSON.stringify(apiConfig.body);
        } else if (contentTypeHeader.includes('application/x-www-form-urlencoded')) {
          finalBody = new URLSearchParams(apiConfig.body).toString();
        } else {
          console.warn(`[WARN] Object body for API '${apiConfig.name || apiConfig.url}' with Content-Type '${contentTypeHeader}' might not be handled correctly. Sending as is.`);
          finalBody = apiConfig.body; // May fail or be misinterpreted by fetch
        }
      } else {
        // Handles string, number, boolean, undefined, null
        finalBody = apiConfig.body;
      }

      const res = await fetch(apiConfig.url, {
        method: apiConfig.method,
        headers: finalHeaders,
        body: finalBody
      });

      const tempo = Date.now() - start;
      const status = res.status;

      const resultado = {
        nome: apiConfig.name,
        status,
        tempo,
        ok: status >= 200 && status < 300
      };

      resultados.push(resultado);

      if (resultado.ok) {
        console.log(`🟢 ${apiConfig.name} | Status: ${status} | Tempo: ${tempo}ms`);
      } else {
        const texto = await res.text();
        console.log(`🔴 ${apiConfig.name} | Status: ${status} | Tempo: ${tempo}ms | [ERROR]: ${texto}`);
      }

    } catch (err) {
      console.log(`🔴 ${apiConfig.name} | Erro: ${err.message}`); // Keep this log for immediate feedback
      resultados.push({
        nome: apiConfig.name,
        status: 'erro',
        tempo: null,
        ok: false,
        rawError: { message: err.message, stack: err.stack } // Add more error detail
      });
    }
  }

  return resultados;
}

module.exports = { testarTodasAPIs, init }; // Modified exports
