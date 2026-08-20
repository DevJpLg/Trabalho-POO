import InterfaceUsuarioRepository from "../usuario.repository";
import Usuario, { Perfil } from "../index";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export type UsuarioSessao = {
    id: number;
    nome: string;
    email: string;
    perfil: Perfil;
};

export type ResultadoLogin = {
    token: string;
    usuario: UsuarioSessao;
};

export interface InterfaceAutenticacaoService { 
    login(email: string, senha: string): Promise<ResultadoLogin | Error>;
    verificarToken(token: string): Promise<Usuario | Error>;
}

export default class AutenticacaoService implements InterfaceAutenticacaoService {
    private repository: InterfaceUsuarioRepository;

    constructor(repository: InterfaceUsuarioRepository) {
        this.repository = repository;
    }

    public async login(email: string, senha: string): Promise<ResultadoLogin | Error> {
        try {
            const usuario = await this.repository.buscarUsuarioPorEmail(email);

            if(!usuario) {
                return new Error("Usuário não encontrado");
            }

            const senhaValida = await bcrypt.compare(senha, usuario.getSenha());
            if(!senhaValida) {
                return new Error("E-mail ou senha incorretos");
            }

            const token = jwt.sign(
                {id: usuario.getId()},
                process.env.JWT_SECRET as string,
                {expiresIn: "8h"}
            );

            return {
                token,
                usuario: {
                    id: usuario.getId(),
                    nome: usuario.getNome(),
                    email: usuario.getEmail(),
                    perfil: usuario.getPerfil(),
                },
            };
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            return new Error("Erro ao fazer login");
        }
    }

    public async verificarToken(token: string): Promise<Usuario | Error> {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
            const usuario = await this.repository.buscarUsuarioPorId(Number(decoded.id));
            if(!usuario) {
                return new Error("Usuário não encontrado");
            }
            return usuario;
        } catch (error) {
            return new Error("Erro ao verificar token");
        }
    }

}
