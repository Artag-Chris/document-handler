import { envs } from './config/envs';
import { AppRoutes } from './presentation/routes';
import { Server } from './presentation/server';

(async () => {
  main();
})();

async function main() {

  const server = new Server({
    port: envs.PORT,
    max_file_size: envs.MAX_FILE_SIZE,
    timeout: envs.REQUEST_TIMEOUT
  });

  server.setRoutes(AppRoutes.routes);

  await server.start();
}