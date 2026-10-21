// Servidor de arranque para App Service en Windows con iisnode.
// iisnode NO habla el protocolo HTTP con el proceso de node: le pasa el puerto
// como un NAMED PIPE en process.env.PORT (por eso hay que pasarlo tal cual a
// listen(), nunca convertirlo a numero). Si no existe PORT, usamos 8080.
const http = require('http');
const next = require('next');

const port = process.env.PORT || 8080;
const app = next({ dev: false, dir: __dirname, hostname: 'localhost', port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    http
      .createServer((req, res) => handle(req, res))
      .listen(port, () => {
        console.log(`Next.js escuchando en ${port}`);
      })
      .on('error', (err) => {
        console.error('Error al arrancar el servidor:', err);
        process.exit(1);
      });
  })
  .catch((err) => {
    console.error('Error en app.prepare():', err);
    process.exit(1);
  });
