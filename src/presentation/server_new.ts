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
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Content-Disposition']
    }));
    
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
