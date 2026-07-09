// PM2 process manager config for the Mediconeeds Next.js server.
//   pm2 start ecosystem.config.cjs --env production
//   pm2 save && pm2 startup   (persist across reboots)
//
// Next.js loads env itself: with NODE_ENV=production it reads `.env.production`
// then `.env` (and `.env.production.local` for gitignored secrets). Put the real
// production secrets in `.env.production.local` on the server — PM2 does NOT need
// to inject them. To run more than one instance, add an Nginx upstream and give
// each instance a distinct PORT (Next `next start` binds a single port).
module.exports = {
  apps: [
    {
      name: "mediconeeds-web",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      env: { NODE_ENV: "production", PORT: "3000" },
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
