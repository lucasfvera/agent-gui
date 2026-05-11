const { createServer } = require('./server/index');
const { PORT } = require('./server/config');

const server = createServer();

server.listen(PORT, () => {
  console.log(`Skills Manager running at http://localhost:${PORT}`);
});