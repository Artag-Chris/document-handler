import 'dotenv/config';
import { get } from 'env-var';
 

export const envs = {  

  PORT: get('PORT').required().asPortNumber(),
  DATABASE_URL: get('DATABASE_URL').required().asString(),
  JWT_SECRET: get('JWT_SECRET').required().asString(),

  // Configuración de Elasticsearch
  ELASTICSEARCH_HOST: get('ELASTICSEARCH_HOST').default('elasticsearch').asString(),
  ELASTICSEARCH_PORT: get('ELASTICSEARCH_PORT').default(9200).asPortNumber(),
  ELASTICSEARCH_USERNAME: get('ELASTICSEARCH_USERNAME').asString(),
  ELASTICSEARCH_PASSWORD: get('ELASTICSEARCH_PASSWORD').asString(),

  // Configuración de límites de archivos
  MAX_FILE_SIZE: get('MAX_FILE_SIZE').default('1gb').asString(),
  MAX_FILES_PER_REQUEST: get('MAX_FILES_PER_REQUEST').default(10).asInt(),
  REQUEST_TIMEOUT: get('REQUEST_TIMEOUT').default(1200000).asInt(), // 20 minutos

}



