const { spawn, execSync } = require('child_process');
const http = require('http');
const net = require('net');

const isWindows = process.platform === 'win32';
const PORT = 9000;

function run(cmd, args) {
  return spawn(cmd, args, { stdio: 'inherit', shell: isWindows });
}

function killPort(port) {
  try {
    if (isWindows) {
      const result = execSync(
        `netstat -ano | findstr :${port} | findstr LISTENING`,
        { encoding: 'utf-8', timeout: 5000 }
      ).trim();
      const lines = result.split('\n');
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore', timeout: 5000 });
          console.log(`[dev] Killed stale process on port ${port} (PID ${pid})`);
        } catch { /* already dead */ }
      }
    }
  } catch {
    // nothing listening on that port — good
  }
}

function waitForServer(url, timeout = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      if (Date.now() - start > timeout) {
        return reject(new Error(`Timed out waiting for ${url}`));
      }
      http.get(url, (res) => {
        if (res.statusCode === 200) resolve();
        else setTimeout(check, 500);
      }).on('error', () => setTimeout(check, 500));
    }
    check();
  });
}

async function main() {
  // Kill anything already on our port
  killPort(PORT);

  console.log('[dev] Starting webpack dev server...');
  const devServer = run('npx', ['webpack', 'serve', '--config', 'webpack.renderer.config.js']);

  devServer.on('error', (err) => {
    console.error('[dev] Dev server failed to start:', err.message);
    process.exit(1);
  });

  console.log(`[dev] Waiting for dev server on http://localhost:${PORT}...`);
  await waitForServer(`http://localhost:${PORT}/widget.html`);
  console.log('[dev] Dev server ready.');

  console.log('[dev] Building main process...');
  execSync('npx webpack --config webpack.main.config.js', { stdio: 'inherit' });

  console.log('[dev] Building preload...');
  execSync('npx webpack --config webpack.preload.config.js', { stdio: 'inherit' });

  console.log('[dev] Launching Electron...');
  const electron = run('npx', ['electron', '.']);

  electron.on('close', (code) => {
    console.log(`[dev] Electron exited (code ${code}). Shutting down...`);
    devServer.kill();
    process.exit(code || 0);
  });

  function cleanup() {
    electron.kill();
    devServer.kill();
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((err) => {
  console.error('[dev] Fatal error:', err.message);
  process.exit(1);
});
