import { Request, Response } from "express";
import InterfaceNotificacaoService from "./notificacao.service";
import Notificacao from "./index";
import Usuario from "../usuario";

export default interface InterfaceNotificacaoController {
    listar(req: Request, res: Response): Promise<void>;
    atender(req: Request, res: Response): Promise<void>;
}

export class NotificacaoController implements InterfaceNotificacaoController {
    constructor(private readonly service: InterfaceNotificacaoService) {}

    private serializarNotificacao(notificacao: Notificacao) {
        return {
            id: notificacao.getId(),
            vendaId: notificacao.getVendaId(),
            dataHora: notificacao.getDataHora(),
            farmaceuticoId: notificacao.getFarmaceuticoId(),
        };
    }

    /* ! ========== Listar Notificações ========== */
    async listar(req: Request, res: Response): Promise<void> {
        const usuarioLogado = req.usuario;

        const resultado = await this.service.listarNotificacoes(usuarioLogado as Usuario);
        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json(resultado.map((notificacao) => this.serializarNotificacao(notificacao)));
    }

    /* ! ========== Atender Notificação ========== */
    async atender(req: Request, res: Response): Promise<void> {
        const usuarioLogado = req.usuario;
        const id = Number(req.params.id);

        const resultado = await this.service.atenderNotificacao(usuarioLogado as Usuario, id);
        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json({ message: "Notificação atendida com sucesso." });
    }
}
