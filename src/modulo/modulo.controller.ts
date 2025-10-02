import { Request, Response } from 'express';
import ModuloService from './modulo.service';
/* 
ejemplo de controladora
*/

export class ModuloController {
    constructor(
        private readonly moduloService = new ModuloService(),
    ) { }

    onSomething = async (req: Request, res: Response) => {
        const payload = req.body;
        const mensaje = await this.moduloService.onSomething(payload);
        res.status(200).send(mensaje);
    }
   
}

