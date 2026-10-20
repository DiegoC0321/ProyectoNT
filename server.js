// Servidor de arranque para App Service en Windows (iisnode).
// iisnode pone process.env.PORT como nombre de un named pipe, por eso hay que
// pasarlo tal cual a listen() en vez de convertirlo a numero.
const http = require('http');
const next = require('next');

const port = process.env.PORT || 3000;
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http
    .createServer((req, res) => handle(req, res))
    .listen(port, () => {
      console.log(`Next.js escuchando en ${port}`);
    });
});
