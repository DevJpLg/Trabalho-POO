import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import multer from "multer";

export const PASTA_UPLOADS_PRESCRICOES = path.join(process.cwd(), "uploads", "prescricoes");

function garantirPasta(): void {
  fs.mkdirSync(PASTA_UPLOADS_PRESCRICOES, { recursive: true });
}

export function criarUploadPrescricaoPdf() {
  garantirPasta();
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        garantirPasta();
        cb(null, PASTA_UPLOADS_PRESCRICOES);
      },
      filename: (req, file, cb) => {
        const vendaId = String(req.body?.vendaId ?? "0");
        const sufixo = randomBytes(4).toString("hex");
        const base = path.basename(file.originalname, path.extname(file.originalname))
          .replace(/[^a-zA-Z0-9_-]+/g, "_")
          .slice(0, 40);
        cb(null, `venda-${vendaId}-${Date.now()}-${base || "receita"}-${sufixo}.pdf`);
      },
    }),
    limits: { fileSize: 1.5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ehPdf =
        file.mimetype === "application/pdf" ||
        file.originalname.toLowerCase().endsWith(".pdf");
      if (!ehPdf) {
        cb(new Error("Envie um arquivo PDF."));
        return;
      }
      cb(null, true);
    },
  });
}

/** Caminho gravado no banco, relativo à pasta `uploads/`. */
export function caminhoRelativoPrescricao(nomeArquivo: string): string {
  return `prescricoes/${nomeArquivo}`;
}

export function caminhoAbsolutoPrescricao(anexoRelativo: string): string | null {
  const normalizado = anexoRelativo.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalizado.startsWith("prescricoes/") || normalizado.includes("..")) {
    return null;
  }
  return path.join(process.cwd(), "uploads", normalizado);
}

export function nomeArquivoDoAnexo(anexo: string): string {
  const partes = anexo.replace(/\\/g, "/").split("/");
  return partes[partes.length - 1] || anexo;
}
