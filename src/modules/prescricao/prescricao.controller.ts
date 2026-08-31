import { Request, Response } from "express";
import fs from "fs";
import InterfacePrescricaoService from "./prescricao.service";
import { caminhoAbsolutoPrescricao, caminhoRelativoPrescricao } from "../../shared/storage/prescricaoArquivo";

export default interface InterfacePrescricaoController {
    cadastrarPrescricao(req: Request, res: Response): Promise<void>;
    baixarArquivoPrescricao(req: Request, res: Response): Promise<void>;
    listarPrescricoes(req: Request, res: Response): Promise<void>;
    listarPrescricoesPorVendaId(req: Request, res: Response): Promise<void>;
    buscarPrescricaoPorId(req: Request, res: Response): Promise<void>;
    buscarPrescricaoPorNumeroPrescricao(req: Request, res: Response): Promise<void>;
    editarPrescricao(req: Request, res: Response): Promise<void>;
    deletarPrescricao(req: Request, res: Response): Promise<void>;
}

export class PrescricaoController implements InterfacePrescricaoController {

  constructor(private service: InterfacePrescricaoService) {}


  public async cadastrarPrescricao(req: Request, res: Response): Promise<void> {
    const arquivo = req.file;
    if (!arquivo) {
      res.status(400).json({ message: "PDF da receita é obrigatório." });
      return;
    }

    const anexo = caminhoRelativoPrescricao(arquivo.filename);
    const retencao = req.body.retencao === true || req.body.retencao === "true";
    const retida = req.body.retida === true || req.body.retida === "true";

    const resultado = await this.service.cadastrarPrescricao(
      String(req.body.numeroPrescricao ?? ""),
      String(req.body.nomeMedico ?? ""),
      String(req.body.numeroCrm ?? ""),
      String(req.body.ufCrm ?? ""),
      String(req.body.nomePaciente ?? ""),
      retencao,
      new Date(req.body.dataEmissao),
      new Date(req.body.dataValidade),
      anexo,
      retida,
      Number(req.body.vendaId),
    );

    if(resultado instanceof Error) {
      try {
        fs.unlinkSync(arquivo.path);
      } catch {
        /* ignore */
      }
      res.status(400).json({ message: resultado.message });
      return;
    }

    res.status(201).json({ message: 'Prescricao cadastrada com sucesso' });
  }


  public async baixarArquivoPrescricao(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const resultado = await this.service.buscarPrescricaoPorId(id);
    if (resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }

    const caminho = caminhoAbsolutoPrescricao(resultado.getAnexo());
    if (!caminho || !fs.existsSync(caminho)) {
      res.status(404).json({ message: "Arquivo da prescrição não encontrado." });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.sendFile(caminho);
  }


  public async listarPrescricoes(req: Request, res: Response): Promise<void> {
    const busca = String(req.query.busca ?? "");

    const resultado = await this.service.listarPrescricoes(busca);

    if(resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }
    res.status(200).json(resultado);
  }


  public async listarPrescricoesPorVendaId(req: Request, res: Response): Promise<void> {
    const vendaId = Number(req.params.vendaId);

    const resultado = await this.service.listarPrescricoesPorVendaId(vendaId);
  
    if(resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }
    res.status(200).json(resultado);
  }

  
  public async buscarPrescricaoPorId(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);

    const resultado = await this.service.buscarPrescricaoPorId(id);
    if(resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }
    res.status(200).json(resultado);
  }


  public async buscarPrescricaoPorNumeroPrescricao(req: Request, res: Response): Promise<void> {
    const numeroPrescricao = String(req.params.numeroPrescricao);

    const resultado = await this.service.buscarPrescricaoPorNumeroPrescricao(numeroPrescricao);
    if(resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }
    res.status(200).json(resultado);
  }


  public async editarPrescricao(req: Request, res: Response): Promise<void> {
    const resultado = await this.service.editarPrescricao(
      Number(req.params.id),
      req.body.numeroPrescricao,
      req.body.nomeMedico,
      req.body.numeroCrm,
      req.body.ufCrm,
      req.body.nomePaciente,
      req.body.retencao,
      new Date(req.body.dataEmissao),
      new Date(req.body.dataValidade),
      req.body.anexo || '',
      req.body.retida,
      req.body.vendaId,
    );
    if(resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }
    res.status(200).json({ message: 'Prescricao editada com sucesso' });
  }

  
  public async deletarPrescricao(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);

    const resultado = await this.service.deletarPrescricao(id);
    if(resultado instanceof Error) {
      res.status(400).json({ message: resultado.message });
      return;
    }
    res.status(200).json({ message: 'Prescricao deletada com sucesso' });
  }

}