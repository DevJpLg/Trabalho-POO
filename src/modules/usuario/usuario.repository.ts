import Usuario, { Perfil } from "./index";
import InterfaceUsuarioFactory from "./usuario.factory";
import { prisma } from "../../shared/database";
import type { PrismaClient } from "../../generated/prisma/client";

export default interface InterfaceUsuarioRepository {
    cadastrarUsuario(usuario: Usuario): Promise<boolean>;
    listarUsuarios(busca: string): Promise<Usuario[] | null>;
    editarUsuario(usuario: Usuario): Promise<boolean>;
    deletarUsuario(id: number): Promise<boolean>;
}

export default class UsuarioRepository implements InterfaceUsuarioRepository {
    private prisma: PrismaClient;

    constructor(client: PrismaClient = prisma, private factory: InterfaceUsuarioFactory) {
        this.prisma = client;
    }


    public async cadastrarUsuario(usuario: Usuario): Promise<boolean> {
        let retorno = false;

        const resultado = await this.prisma.usuario.create({
            data: {
                nome: usuario.getNome(),
                email: usuario.getEmail(),
                senha: usuario.getSenha(),
                perfil: usuario.getPerfil(),
            },
        });

        if (resultado.id) {
            retorno = true;
        }
        return retorno;
    }


    public async listarUsuarios(busca: string): Promise<Usuario | Usuario[] | null> {
        const resultado = await this.prisma.usuario.findMany({
            where: { OR: [
                { nome: { contains: busca } },
                { email: { contains: busca } },
                { numeroCRF: { contains: busca } }
            ]}
        });

        if (resultado.length > 0) { 
            const usuarios = resultado.map((rows) =>
                this.factory.rebuildUsuario(
                    rows.id,
                    rows.nome,
                    rows.email,
                    rows.senha,
                    rows.perfil as Perfil,
                    rows.numeroCRF ?? undefined,
                )
            );
            return usuarios.length === 1 ? usuarios[0] : usuarios;
        }
        return null;
    }


    public async buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
        const resultado = await this.prisma.usuario.findUnique({
            where: { email: email },
        });
        return resultado ? this.factory.rebuildUsuario(
            resultado.id, 
            resultado.nome, 
            resultado.email, 
            resultado.senha, 
            resultado.perfil as Perfil, 
            resultado.numeroCRF ?? undefined) : null;
    }


    public async buscarUsuarioPorId(id: number): Promise<Usuario | null> {
        const resultado = await this.prisma.usuario.findUnique({
            where: { id: id },
        });
        return resultado ? this.factory.rebuildUsuario(
            resultado.id, 
            resultado.nome, 
            resultado.email, 
            resultado.senha, 
            resultado.perfil as Perfil, 
            resultado.numeroCRF ?? undefined) : null;
    }


    public async editarUsuario(usuario: Usuario): Promise<boolean> {
        const resultado = await this.prisma.usuario.update({
            where: { id: usuario.getId() },
            data: {
                nome: usuario.getNome(),
                email: usuario.getEmail(),
                senha: usuario.getSenha(),
                perfil: usuario.getPerfil(),
            },
        });
        return resultado ? true : false;
    }


    public async deletarUsuario(id: number): Promise<boolean> {
        const resultado = await this.prisma.usuario.delete({
            where: { id: id },
        });
        return resultado ? true : false;
    }
}
