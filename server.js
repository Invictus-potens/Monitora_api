const express = require('express');
const cors = require('cors');
const path = require('path');
const { testarTodasAPIs } = require('./monitora-apis');

const app = express();
app.use(cors());
app.use(express.static(__dirname));

// Lista de APIs para monitorar
const apisParaTestar = [
  {
    name: "API Ro-Mega - Verificar Cliente",
    url: "http://api.rourbanismo.com.br:9096/operations/contract/list",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "VBO-201-DS"
    },
    body: {
      "cpfCnpj": "04350185828"
    }
  },
  {
    name: "API Agendor - Astral Franca",
    url: "https://api.agendor.com.br/v3/organizations",
    method: "GET",
    headers: {
      "Authorization": "Token 883abd7e-4660-43d2-8d13-f9ea8cfaed1c",
      "Content-Type": "application/json"
    }
  },
  {
    name: "API Agendor - Astral Ribeirão Preto",
    url: "https://api.agendor.com.br/v3/organizations",
    method: "GET",
    headers: {
      "Authorization": "Token ba5c00e1-588d-4387-83a5-47cc65dac5b2",
      "Content-Type": "application/json"
    }
  },
  {
    name: "API Agendor - Regoto",
    url: "https://api.agendor.com.br/v3/organizations",
    method: "GET",
    headers: {
      "Authorization": "Token 6377f2d2-5b35-4ce2-99ae-9b4358d0e340",
      "Content-Type": "application/json"
    }
  },
  {
    name: "API Atri",
    url: "https://conference.atri.com.br/integra/ws.php",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: {
      "cpf_cnpj": "",
      "token": "8f06304a58320d291e80d78000263e076"
    }
  }
];

let ultimoResultado = null;
let ultimaExecucao = null;

async function monitorarAPIs() {
  try {
    const resultados = await testarTodasAPIs(apisParaTestar);
    ultimoResultado = resultados;
    ultimaExecucao = new Date();
    console.log(`[${ultimaExecucao.toLocaleString('pt-BR')}] Monitoramento executado.`);
  } catch (error) {
    console.error('Erro ao monitorar APIs:', error);
    ultimoResultado = null;
  }
}

// Executa ao iniciar
monitorarAPIs();
// Agenda para rodar a cada 10 minutos
setInterval(monitorarAPIs, 10 * 60 * 1000);

// Rota para obter o status das APIs
app.get('/status-apis', (req, res) => {
  res.json({
    atualizadoEm: ultimaExecucao,
    resultados: ultimoResultado
  });
});

// Servir o dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 48019;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`✅ Dashboard disponível em http://${HOST}:${PORT}`);
});