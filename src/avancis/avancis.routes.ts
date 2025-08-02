import { Router } from "express";
import { AvancisController } from "./avancis.controller";
import { REQUIRED_HEADERS } from "../config/middlewareRequired/middlewareHeaderRequired";
import { checkHeaders } from "./middlewares/avancis.header.middleware";


export class AvancisRoutes {
  static get routes() { 
    const router = Router();
    const avancisController = new AvancisController();

    // Aplicar middleware a todas las rutas de este módulo
    router.use(checkHeaders(REQUIRED_HEADERS));

    // Funciones de recepción de mensajes usuarios
    router.post(`/testConection`, avancisController.sendHello);
    router.get(`/data`, avancisController.sendData); // Example of another route
   
    return router;
  }
}