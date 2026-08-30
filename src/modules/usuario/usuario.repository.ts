import Usuario, { Perfil } from "./index";
import InterfaceUsuarioFactory from "./usuario.factory";
import { prisma } from "../../shared/database";
import type { PrismaClient } from "../../generated/prisma/client";

export default interface InterfaceUsuarioRepository {
    cadastrarUsuario(usuario: Usuario): Promise<boolean>;
    listarUsuarios(busca: string): Promise<Usuario[]>;
    buscarUsuarioPorEmail(email: string): Promise<Usuario | null>;
    buscarUsuarioPorId(id: number): Promise<Usuario | null>;
    editarUsuario(usuario: Usuario): Promise<boolean>;
    deletarUsuario(id: number): Promise<boolean>;
    alterarStatusUsuario(id: number, ehAtivo: boolean): Promise<boolean>;
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


    public async listarUsuarios(busca: string): Promise<Usuario[]> {
        const resultado = await this.prisma.usuario.findMany({
            where: {
                OR: [
                    { nome: { contains: busca } },
                    { email: { contains: busca } },
                    { numeroCRF: { contains: busca } }
                ]
            },
            orderBy: [{ nome: "asc" }],
        });

        return resultado.map((rows) =>
            this.factory.rebuildUsuario(
                rows.id,
                rows.nome,
                rows.email,
                rows.senha,
                rows.perfil as Perfil,
                rows.numeroCRF ?? undefined,
                rows.ehAtivo,
            )
        );
    }


    public async buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
        const resultado = await this.prisma.usuario.findFirst({
            where: { email: email, ehAtivo: true },
        });
        return resultado ? this.factory.rebuildUsuario(
            resultado.id,
            resultado.nome,
            resultado.email,
            resultado.senha,
            resultado.perfil as Perfil,
            resultado.numeroCRF ?? undefined,
            resultado.ehAtivo) : null;
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
            resultado.numeroCRF ?? undefined,
            resultado.ehAtivo) : null;
    }


    public async editarUsuario(usuario: Usuario): Promise<boolean> {
        const senha = usuario.getSenha();
        const data: {
            nome: string;
            email: string;
            perfil: Perfil;
            senha?: string;
        } = {
            nome: usuario.getNome(),
            email: usuario.getEmail(),
            perfil: usuario.getPerfil(),
        };

        if (senha && senha.trim() !== "") {
            data.senha = senha;
        }

        const resultado = await this.prisma.usuario.update({
            where: { id: usuario.getId() },
            data,
        });
        return resultado ? true : false;
    }


    public async deletarUsuario(id: number): Promise<boolean> {
        const usuarioExistente = await this.prisma.usuario.findUnique({
            where: { id: id },
        });

        if (!usuarioExistente || !usuarioExistente.ehAtivo) {
            return false;
        }

        const resultado = await this.prisma.usuario.update({
            where: { id: id },
            data: { ehAtivo: false },
        });
        return resultado ? true : false;
    }

    public async alterarStatusUsuario(id: number, ehAtivo: boolean): Promise<boolean> {
        const resultado = await this.prisma.usuario.update({
            where: { id: id },
            data: { ehAtivo },
        });
        return resultado ? true : false;
    }
}