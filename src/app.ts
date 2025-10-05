import { envs } from './config/envs';
import { AppRoutes } from './presentation/routes';
import { Server } from './presentation/server';
import { ElasticsearchService } from './config/elasticsearch.service';
import { createServer } from 'http';


(async () => {
  main();
})();

async function main() {
  const server = new Server({
    port: envs.PORT,
    max_file_size: envs.MAX_FILE_SIZE, // Desde variables de entorno
    timeout: envs.REQUEST_TIMEOUT // Desde variables de entorno
  });
  const httpServer = createServer(server.app);

  server.setRoutes(AppRoutes.routes);

  httpServer.listen(envs.PORT, '0.0.0.0', async () => {
    console.log(`🚀 Server corriendo en el puerto ${envs.PORT}`);
    console.log(`🌐 API disponible en: http://localhost:${envs.PORT}`);
    
    // Verificar conexión con Elasticsearch al inicio
    console.log('\n🔍 Verificando conexión con Elasticsearch...');
    const elasticsearchService = ElasticsearchService.getInstance();
    const connectionResult = await elasticsearchService.testConnection();
    
    if (connectionResult.connected) {
      console.log('✅ Elasticsearch conectado exitosamente');
      console.log(`📊 Cluster: ${connectionResult.info?.cluster}`);
      console.log(`📈 Versión: ${connectionResult.info?.version}`);
    } else {
      console.log('❌ Error conectando con Elasticsearch:');
      console.log(`   ${connectionResult.error}`);
      console.log('⚠️  La API funcionará pero sin capacidades de búsqueda');
    }
    
    console.log('\n📋 Endpoints disponibles:');
    console.log(`   Health: http://localhost:${envs.PORT}/health`);
    console.log(`   Documentos: http://localhost:${envs.PORT}/api/documents`);
    console.log(`   Elasticsearch: http://localhost:${envs.PORT}/api/elasticsearch/test-connection`);
  });
}