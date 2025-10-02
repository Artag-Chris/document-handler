import { Router } from "express";

import { ModuloController } from "./modulo.controller";

export class ModuloRoutes {


    static get routes(){ 
    const router= Router();

    const moduloController =new ModuloController();

    //funciones de recepcion de mensajes usuarios
    router.post(`/ejemplo`,moduloController.onSomething);
   
    
return router;
 }
}