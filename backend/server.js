// Hostinger entrypoint wrapper -- start the compiled TypeScript build
import('./dist/server.js')
  .then(() => {
    console.log('Backend started from dist/server.js');
  })
  .catch((err) => {
    console.error('Error starting backend from dist/server.js', err);
    process.exit(1);
  });
