const app = require('https-localhost')();

app.use((_, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

app.serve(process.argv.length === 3 ? process.argv[2] : process.cwd());
