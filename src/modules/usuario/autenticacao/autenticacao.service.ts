import InterfaceUsuarioRepository from "../usuario.repository";
import Usuario, { Perfil } from "../index";
import jwt from "jsonwebtoken";

export interface InterfaceAutenticacaoService { 
    login(email: string, senha: string): Promise<string | Error>;
    verificarToken(token: string): Promise<Usuario | Error>;
}

export default class AutenticacaoService implements InterfaceAutenticacaoService {
    private repository: InterfaceUsuarioRepository;

    constructor(repository: InterfaceUsuarioRepository) {
        this.repository = repository;
    }

    public async login(email: string, senha: string): Promise<string | Error> {
        try {
            const usuario = await this.repository.buscarUsuarioPorEmail(email);

            if(!usuario) {
                return new Error("Usuário não encontrado");
            }

            if(usuario.getSenha() !== senha) {
                return new Error("E-mail ou senha incorretos");
            }

            const token = jwt.sign(
                {id: usuario.getId()},
                process.env.JWT_SECRET as string,
                {expiresIn: "8h"}
            );

            return token;
        } catch (error) {
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