module.exports = {
  apps: [
    {
      name: 'clothing-store-backend',
      script: './backend/server.js',
      cwd: __dirname,
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
