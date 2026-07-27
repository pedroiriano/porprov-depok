const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = `sed -i 's|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=https://10.11.5.80,http://10.11.5.80,http://10.11.5.80:3000,http://10.11.5.80:5173,https://10.11.5.80:5174|' /home/diskominfo/porprov-depok/infra/docker/.env && cd /home/diskominfo/porprov-depok && docker compose -f infra/docker/docker-compose.yml restart api-gateway`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
          .on('data', data => process.stdout.write(data))
          .stderr.on('data', data => process.stderr.write(data));
  });
}).connect({ host: '10.11.5.80', port: 22, username: 'diskominfo', password: '@#Mn4rgonda54' });
