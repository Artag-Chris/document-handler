import express, { Router } from "express";
import path from "path";
import cors from "cors";

interface Options {
  port: number;
  public_path?: string;
  max_file_size?: string;
  timeout?: number;
}

export class Server {
  public readonly app = express();
  private serverListener?: any;
  private readonly port: number;
  private readonly publicPath: string;
  private readonly maxFileSize: string;
  private readonly timeout: number;

  constructor(options: Options) {
    const { port, public_path = "public", max_file_size = "500mb", timeout = 300000 } = options;
    this.port = port;
    this.publicPath = public_path;
    this.maxFileSize = max_file_size;
    this.timeout = timeout;
    this.configure();
  }

  private configure() {
    // Configuración CORS mejorada para manejar preflight requests
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Content-Disposition',
        'x-finova-api-key',
        'x-finovaClient-id',
        'Accept',
        'Origin',
        'X-Requested-With'
      ],
      exposedHeaders: ['Content-Disposition'],
      credentials: false,
      optionsSuccessStatus: 200 // Para browsers antiguos
    }));

    // Middleware adicional para asegurar headers CORS en todas las responses
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      console.log(`🌐 Request from origin: ${origin} to ${req.method} ${req.path}`);
      
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Disposition, x-finova-api-key, x-finovaClient-id, Accept, Origin, X-Requested-With');
      res.header('Access-Control-Expose-Headers', 'Content-Disposition');
      
      // Responder a preflight requests
      if (req.method === 'OPTIONS') {
        console.log(`✅ Handling OPTIONS preflight request for ${req.path}`);
        res.status(200).end();
        return;
      }
      next();
    });
    
    this.app.use(express.json({ limit: this.maxFileSize }));
    this.app.use(express.urlencoded({ limit: this.maxFileSize, extended: true }));
    
    this.app.use((req, res, next) => {
      req.setTimeout(this.timeout);
      res.setTimeout(this.timeout);
      next();
    });

    this.app.use(express.static(this.publicPath));

    this.app.get(/^\/(?!api).*/, (req, res) => {
      const indexPath = path.join(
        __dirname + `../../../${this.publicPath}/index.html`
      );
      res.sendFile(indexPath);
    });
  }

  public setRoutes(router: Router) {
    this.app.use(router);
  }

  async start() {
    this.serverListener = this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }

  public close() {
    this.serverListener?.close();
  }
}
