import { Router, type Request, type Response, type NextFunction } from "express";
import InterfacePrescricaoController from "./prescricao.controller";
import { criarUploadPrescricaoPdf } from "../../shared/storage/prescricaoArquivo";

const uploadPdf = criarUploadPrescricaoPdf();

function receberPdf(req: Request, res: Response, next: NextFunction): void {
  uploadPdf.single("arquivo")(req, res, (err: unknown) => {
    if (err) {
      const mensagem = err instanceof Error ? err.message : "Erro ao receber o PDF.";
      res.status(400).json({ message: mensagem });
      return;
    }
    next();
  });
}

export function criarPrescricaoRoutes(controller: InterfacePrescricaoController): Router {
  const prescricaoRouter = Router();

  prescricaoRouter.post("/", receberPdf, controller.cadastrarPrescricao.bind(controller));
  prescricaoRouter.get("/", controller.listarPrescricoes.bind(controller));
  prescricaoRouter.get("/venda/:vendaId", controller.listarPrescricoesPorVendaId.bind(controller));
  prescricaoRouter.get("/:id/arquivo", controller.baixarArquivoPrescricao.bind(controller));
  prescricaoRouter.get("/numero/:numeroPrescricao", controller.buscarPrescricaoPorNumeroPrescricao.bind(controller));
  prescricaoRouter.get("/:id", controller.buscarPrescricaoPorId.bind(controller));
  prescricaoRouter.put("/:id", controller.editarPrescricao.bind(controller));
  prescricaoRouter.delete("/:id", controller.deletarPrescricao.bind(controller));

  return prescricaoRouter;
}
