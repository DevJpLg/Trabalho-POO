import InterfaceUsuarioRepository from "./usuario.repository";
import InterfaceUsuarioFactory from "./usuario.factory";
import Usuario, { Perfil } from "./index";

export default interface InterfaceUsuarioService {
    cadastrarUsuario(usuarioLogado: Usuario, nome: string, email: string, senha: string, perfil: Perfil, numeroCRM?: string): Promise<boolean | Error>;
    listarUsuarios(usuarioLogado: Usuario, busca: string): Promise<Usuario[] | Error>;
    editarUsuario(usuarioLogado: Usuario, id: number, nome: string, email: string, senha: string, perfil: Perfil, numeroCRM?: string): Promise<void | Error>;
    deletarUsuario(usuarioLogado: Usuario, id: number): Promise<void | Error>;
}

export default class UsuarioService implements InterfaceUsuarioService {
    private repository: InterfaceUsuarioRepository;

    constructor(repository: InterfaceUsuarioRepository, private factory: InterfaceUsuarioFactory) {
        this.repository = repository;
    }


    public async cadastrarUsuario(usuarioLogado: Usuario, nome: string, email: string, senha: string, perfil: Perfil, numeroCRM?: string): Promise<boolean | Error> {
        try {
            if(usuarioLogado.getPerfil() !== Perfil.GERENTE) {
                return new Error("Usuário não autorizado");
            }

            const usuarioExistente = await this.repository.buscarUsuarioPorEmail(email);
            if(usuarioExistente) {
                return new Error("Usuario já cadastrado");
            }

            const usuarioCriado = this.factory.criarUsuario(nome, email, senha, perfil, numeroCRM ?? undefined);
            if(!usuarioCriado) {
                return new Error("Erro ao criar usuário");
            }

            const usuarioCadastrado = await this.repository.cadastrarUsuario(usuarioCriado);
            if(!usuarioCadastrado) {
                return new Error("Erro ao cadastrar usuário");
            }
            return true;

        } catch (error) {
            return new Error("Erro ao criar usuário");
        }
    }

    public async listarUsuarios(usuarioLogado: Usuario, busca: string): Promise<Usuario[] | Error> {
        try {
            if(usuarioLogado.getPerfil() !== Perfil.GERENTE) {
                return new Error("Usuário não autorizado");
            }

            const resultado = await this.repository.listarUsuarios(busca);
            if(!resultado || resultado === null) {
                return new Error("Erro ao listar usuários");
            }
            return resultado as Usuario[];
        } catch (error) {
            return new Error("Erro ao listar usuários");
        }
    }

    public async editarUsuario(usuarioLogado: Usuario, id: number, nome: string, email: string, senha: string, perfil: Perfil, numeroCRM?: string): Promise<void | Error> {
        try {
            if(usuarioLogado.getPerfil() !== Perfil.GERENTE) {
                return new Error("Usuário não autorizado");
            }

            const usuarioExistente = await this.repository.buscarUsuarioPorId(id);
            if(!usuarioExistente || usuarioExistente === null) { 
                return new Error("Usuario não encontrado"); 
            }

            const usuarioAtualizado = this.factory.rebuildUsuario(id, nome, email, senha, perfil, numeroCRM ?? undefined);
            if(!usuarioAtualizado) {
                return new Error("Erro ao atualizar usuário");
            }

            const resultado = await this.repository.editarUsuario(usuarioAtualizado);
            if(!resultado) {
                return new Error("Erro ao atualizar usuário");
            }
        } catch (error) {
            return new Error("Erro ao editar usuário");
        }
    }


    public async deletarUsuario(usuarioLogado: Usuario, id: number): Promise<void | Error> {
        try {
            if(usuarioLogado.getPerfil() !== Perfil.GERENTE) {
                return new Error("Usuário não autorizado");
            }

            const usuarioExistente = await this.repository.buscarUsuarioPorId(id);
            if(!usuarioExistente || usuarioExistente === null) { 
                return new Error("Usuario não encontrado"); 
            }

            const resultado = await this.repository.deletarUsuario(id);
            if(!resultado) {
                return new Error("Erro ao deletar usuário");
            }
        } catch (error) {
            return new Error("Erro ao deletar usuário");
        }
    }
}
