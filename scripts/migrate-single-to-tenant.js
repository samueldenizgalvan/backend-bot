#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('TENANT_ID: ', tenantId => {
  if (!tenantId) {
    console.error('❌ No TENANT_ID provided. Aborting.');
    rl.close();
    process.exit(1);
  }

  const rootDir = path.resolve(__dirname, '..');
  const dataTarget = path.join(rootDir, 'data', tenantId);
  const sessionsTarget = path.join(rootDir, 'sessions', tenantId);

  fs.mkdirSync(dataTarget, { recursive: true });
  fs.mkdirSync(sessionsTarget, { recursive: true });

  const dataSources = [
    { src: path.join(rootDir, 'citas.json'), dest: path.join(dataTarget, 'citas.json') },
    { src: path.join(rootDir, 'flow.json'), dest: path.join(dataTarget, 'flow.json') },
    { src: path.join(rootDir, 'userflows'), dest: path.join(dataTarget, 'userflows') }
  ];

  dataSources.forEach(({ src, dest }) => {
    if (fs.existsSync(src)) {
      fs.cpSync(src, dest, { recursive: true });
      console.log(`✅ Copiado ${src} -> ${dest}`);
    } else {
      console.log(`⚠️  No encontrado: ${src}`);
    }
  });

  const sessionSrc = path.join(rootDir, '.wwebjs_auth');
  if (fs.existsSync(sessionSrc)) {
    fs.cpSync(sessionSrc, sessionsTarget, { recursive: true });
    console.log(`✅ Copiado ${sessionSrc} -> ${sessionsTarget}`);
  } else {
    console.log(`⚠️  No encontrado: ${sessionSrc}`);
  }

  console.log('Migración completada. Los datos originales permanecen intactos.');
  rl.close();
});
