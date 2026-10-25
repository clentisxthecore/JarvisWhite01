// Ponte JARVIS -> Claude Code. Sem dependências. Uso: node bridge.js
// Variáveis opcionais: PORT, WORKDIR (pasta do projeto), CLAUDE_FLAGS
const http = require('http'), fs = require('fs'), path = require('path');
const { spawn } = require('child_process');
const PORT = process.env.PORT || 8787;
const FLAGS = (process.env.CLAUDE_FLAGS || '--permission-mode acceptEdits').split(' ');

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.end();
  if (req.url === '/ping') return res.end('ok');
  if (req.method === 'GET') {
    return fs.readFile(path.join(__dirname, 'jarvis.html'), (err, d) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(err ? 'jarvis.html não encontrado ao lado do bridge.js' : d);
    });
  }
  if (req.url === '/ask' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const { prompt } = JSON.parse(body || '{}');
      const p = spawn('claude', ['-p', '--output-format', 'stream-json', '--verbose', ...FLAGS], {
        cwd: process.env.WORKDIR || process.cwd(),
        shell: process.platform === 'win32',
        stdio: ['pipe', 'pipe', 'inherit'],
      });
      res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
      p.stdin.end(prompt || '');
      p.stdout.pipe(res);
      res.on('close', () => p.kill());
    });
  }
}).listen(PORT, '127.0.0.1', () => console.log(`JARVIS em http://localhost:${PORT}`));
