#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

// Detecta o caminho correto do main.js
const possiblePaths = [
  './dist/main.js',
  './dist/apps/api/src/main.js',
  './dist/src/main.js'
];

const fs = require('fs');
let mainPath = null;

for (const p of possiblePaths) {
  if (fs.existsSync(path.join(__dirname, p))) {
    mainPath = p;
    break;
  }
}

if (!mainPath) {
  console.error('Erro: Arquivo main.js não encontrado em dist/');
  console.error('Execute: pnpm build');
  process.exit(1);
}

console.log(`Iniciando servidor: ${mainPath}`);

const child = spawn('node', [mainPath], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code);
});
