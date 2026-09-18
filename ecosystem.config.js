module.exports = {
  apps: [
    {
      name: 'houseasy-rental',
      cwd: '/var/www/houseasy-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 127.0.0.1 -p 3002',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3002',
        HOSTNAME: '127.0.0.1',
      },
    },
  ],
};
