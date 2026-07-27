const { Client } = require('ssh2');

const conn = new Client();

const runCommand = (cmd) => {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let output = '';
      stream.on('close', (code, signal) => {
        console.log(`Command exited with code ${code}`);
        resolve({ code, output });
      }).on('data', (data) => {
        process.stdout.write(data);
        output += data.toString();
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
        output += data.toString();
      });
    });
  });
};

conn.on('ready', async () => {
  console.log('Client :: ready');
  try {
    const pwd = '@#Mn4rgonda54';
    
    // 1. Configure .env
    const setupEnvCmd = `
      cd ~/porprov-depok/infra/docker &&
      cp .env.example .env &&
      sed -i 's/localhost/10.11.5.80/g' .env
    `;
    await runCommand(setupEnvCmd);

    // 2. Start Docker Compose
    const startDockerCmd = `
      cd ~/porprov-depok/infra/docker &&
      echo '${pwd}' | sudo -S docker compose up -d
    `;
    await runCommand(startDockerCmd);

    console.log('VPS Provisioning Phase 3 completed!');
    conn.end();
  } catch (e) {
    console.error('Error during execution:', e);
    conn.end();
  }
}).connect({
  host: '10.11.5.80',
  port: 22,
  username: 'diskominfo',
  password: '@#Mn4rgonda54',
  readyTimeout: 20000
});
