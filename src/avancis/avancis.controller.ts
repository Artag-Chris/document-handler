import { Request, Response } from 'express';
import AvancisService from './avancis.service';

export class AvancisController {
    constructor(
        private readonly avancisService = new AvancisService(),
    ) { }

    sendHello = async (req: Request, res: Response) => {
        try {
            const result = await this.avancisService.sendHello(req.body);
            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Error al procesar la solicitud'
            });
        }
    }

    sendData = async (req: Request, res: Response) => {
        try {
            // Aquí podrías implementar la lógica para enviar datos
            res.status(200).json({
                status: 'success',
                message: 'Datos enviados correctamente'
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Error al enviar los datos'
            });
        }
    }
}