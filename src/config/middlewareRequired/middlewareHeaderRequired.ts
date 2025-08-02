import { envs } from "../envs";

export const REQUIRED_HEADERS = {
  'x-finova-api-key': `${envs.JWT_SECRET}`,
  'x-finovaClient-id': 'tu-client-id', // se deberia tener un lugar donde listemos los clientes y ver si esta activo o no y responder segun su estado por ahora esta de prueba
};