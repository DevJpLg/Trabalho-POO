import { Request, Response } from "express";
import InterfaceUsuarioService from "./usuario.service";
import Usuario, { Perfil } from "./index";

export default interface InterfaceUsuarioController {
    cadastrarUsuario(req: Request, res: Response): Promise<void>;
    listarUsuario(req: Request, res: Response): Promise<void>;
    editarUsuario(req: Request, res: Response): Promise<void>;
    deletarUsuario(req: Request, res: Response): Promise<void>;
}


export default class UsuarioController implements InterfaceUsuarioController {

    constructor(private readonly service: InterfaceUsuarioService) {
    }


    private serializarUsuario(usuario: Usuario) {
        return {
            id: usuario.getId(),
            nome: usuario.getNome(),
            email: usuario.getEmail(),
            perfil: usuario.getPerfil(),
        };
    }


    async cadastrarUsuario(req: Request, res: Response): Promise<void> {

        const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
        const { nome, email, senha, perfil, numeroCRM } = req.body;

        const resultado = await this.service.cadastrarUsuario(
            usuarioLogado as Usuario,
            nome,
            email,
            senha,
            perfil as Perfil,
            numeroCRM ?? undefined,
        );

        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(201).json({ message: "Usuário cadastrado com sucesso." });
    }


    async listarUsuario(req: Request, res: Response): Promise<void> {

        const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
        const busca = String(req.query.busca ?? "");

        const resultado = await this.service.listarUsuarios(usuarioLogado as Usuario, busca);

        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json(resultado.map((usuario) => this.serializarUsuario(usuario)));
    }


    async editarUsuario(req: Request, res: Response): Promise<void> {

        const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
        const id = Number(req.params.id);
        const { nome, email, senha, perfil, numeroCRM } = req.body;

        const resultado = await this.service.editarUsuario(
            usuarioLogado as Usuario,
            id,
            nome,
            email,
            senha,
            perfil as Perfil,
            numeroCRM,
        );

        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(200).json({ message: "Usuário atualizado com sucesso." });
    }


    async deletarUsuario(req: Request, res: Response): Promise<void> {

        const usuarioLogado = req.usuario; //Vai adicionar o usuario depois, calma
        const id = Number(req.params.id);

        const resultado = await this.service.deletarUsuario(usuarioLogado as Usuario, id);

        if (resultado instanceof Error) {
            res.status(400).json({ message: resultado.message });
            return;
        }

        res.status(204).send();
    }
}
