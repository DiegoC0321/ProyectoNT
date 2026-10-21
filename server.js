// Servidor de arranque para App Service en Windows con iisnode.
//
// iisnode NO habla HTTP con el proceso de node: le pasa el puerto como un
// NAMED PIPE en process.env.PORT (por ejemplo \\.\pipe\xxxx), y hay que
// pasarlo tal cual a listen() sin convertirlo a numero.
//
// IMPORTANTE: si no llega PORT, NO hay que escuchar en un puerto fijo tipo
// 8080, porque iisnode ya ocupa ese puerto y se produce EADDRINUSE. En ese
// caso (ejecucion manual) usamos un puerto alto libre.
const http = require('http');
const next = require('next');

const port = process.env.PORT || 3971;
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
