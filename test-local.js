// test-local.js
// Script to test API monitoring logic with a hardcoded list of APIs.
// To run: node test-local.js

const { testarTodasAPIs } = require('./monitora-apis');

const apisParaTestar = [
  {
    name: "API Ro-Mega - Verificar Cliente",
    url: "http://api.rourbanismo.com.br:9096/operations/contract/list",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "VBO-201-DS"
    },
    body: { // Will be stringified by testarTodasAPIs
      "cpfCnpj": "04350185828"
    }
  },
  {
    name: "API Agendor - Astral Franca",
    url: "https://api.agendor.com.br/v3/organizations",
    method: "GET",
    headers: {
      "Authorization": "Token 883abd7e-4660-43d2-8d13-f9ea8cfaed1c",
      "Content-Type": "application/json" // Content-Type for a GET might be ignored by server, but good to include
    }
    // No body for GET
  },
  {
    name: "API Agendor - Astral Ribeirão Preto",
    url: "https://api.agendor.com.br/v3/organizations",
    method: "GET",
    headers: {
      "Authorization": "Token ba5c00e1-588d-4387-83a5-47cc65dac5b2",
      "Content-Type": "application/json"
    }
    // No body for GET
  },
  {
    name: "API Agendor - Regoto",
    url: "https://api.agendor.com.br/v3/organizations",
    method: "GET",
    headers: {
      "Authorization": "Token 6377f2d2-5b35-4ce2-99ae-9b4358d0e340",
      "Content-Type": "application/json"
    }
    // No body for GET
  },
  {
    name: "API Atri",
    url: "https://conference.atri.com.br/integra/ws.php",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: { // Will be URL-encoded by testarTodasAPIs
      "cpf_cnpj": "", // Assuming empty string is intentional
      "token": "8f06304a58320d291e80d78000263e076"
    }
  }
];

async function main() {
  console.log("Starting local API test run...");
  try {
    const resultados = await testarTodasAPIs(apisParaTestar);
    console.log("\n--- Test Results ---");
    if (resultados && resultados.length > 0) {
      resultados.forEach(resultado => {
        const icon = resultado.ok ? '🟢' : '🔴';
        const statusText = resultado.status === 'erro' ? `Erro: ${resultado.nome} - ${ (resultado.rawError && resultado.rawError.message) ? resultado.rawError.message : 'Unknown error'}` : `Status: ${resultado.status}`;
        const timeText = resultado.tempo !== null ? `Tempo: ${resultado.tempo}ms` : '';
        console.log(`${icon} ${resultado.nome} | ${statusText} | ${timeText}`);
      });
    } else {
      console.log("No results returned or an issue occurred during testing.");
    }
  } catch (error) {
    console.error("\n[ERROR] An error occurred during the test run:", error);
  }
  console.log("\nLocal API test run finished.");
}

main();
