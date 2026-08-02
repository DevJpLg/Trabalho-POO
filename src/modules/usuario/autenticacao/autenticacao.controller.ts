import { Request, Response } from "express";
import { InterfaceAutenticacaoService } from "./autenticacao.service";

export interface InterfaceAutenticacaoController {
    login(req: Request, res: Response): Promise<void>;
}

export default class AutenticacaoController {
    private service: InterfaceAutenticacaoService;

    constructor(service: InterfaceAutenticacaoService) {
        this.service = service;
    }

    public async login(req: Request, res: Response ): Promise<void> {
        try {
            const { email, senha } = req.body;
            
            const resultado = await this.service.login(email, senha);
            
            if (!email || !senha) {
                res.status(400).json({message: "E-mail e senha são obrigatórios"});
                return;
            }
            
            if (resultado instanceof Error) {
                res.status(401).json({message: resultado.message});
                return;
            }
            
            res.status(200).json({
                token: resultado
            });
        } catch (error) {
            res.status(500).json({message: "Erro interno do servidor"});
            return;
        }
    }
}