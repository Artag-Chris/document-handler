import { envs } from './config/envs';
import { AppRoutes } from './presentation/routes';
import { Server } from './presentation/server';
import { createServer } from 'http';
//import { WSService } from './notifications/wss.serviceImprove';

(async () => {
  main();
})();

function main() {
  const server = new Server({
    port: envs.PORT,
    max_file_size: '500mb',
    timeout: 600000 // 10 minutos para operaciones largas
  });
  const httpServer = createServer(server.app);

  //ws conection
 // WSService.getInstance(httpServer as any, '/wsImproved');


  server.setRoutes(AppRoutes.routes);

  httpServer.listen(envs.PORT, '0.0.0.0', () => {
    console.log(`Server corriendo en el puerto ${envs.PORT}`);
  //  console.log(`WebSocket server improved is running on ws://localhost:${envs.PORT}/wsImproved`);

  });
}