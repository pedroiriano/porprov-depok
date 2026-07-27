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
    
    // 1. Install prerequisites
    await runCommand(`echo '${pwd}' | sudo -S DEBIAN_FRONTEND=noninteractive apt-get update`);
    await runCommand(`echo '${pwd}' | sudo -S DEBIAN_FRONTEND=noninteractive apt-get install -y git curl ufw`);
    
    // 2. Install Docker if not present
    let res = await runCommand('command -v docker');
    if (res.code !== 0) {
      await runCommand(`curl -fsSL https://get.docker.com -o get-docker.sh`);
      await runCommand(`echo '${pwd}' | sudo -S sh get-docker.sh`);
      await runCommand(`echo '${pwd}' | sudo -S usermod -aG docker diskominfo`);
    } else {
      console.log('Docker already installed');
    }

    // 3. Clone Repository
    res = await runCommand('ls -ld porprov-depok');
    if (res.code !== 0) {
      await runCommand(`git clone https://github.com/pedroiriano/porprov-depok.git`);
    } else {
      console.log('Repo exists. Pulling latest...');
      await runCommand(`cd porprov-depok && git reset --hard && git pull origin main`);
    }

    console.log('VPS Provisioning Phase 1 & 2 completed!');
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
