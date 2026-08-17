import Usuario, { Perfil } from "../index";

export default interface InterfaceAutorizacaoService {
    usuarioPodeGerenciarUsuarios(usuarioLogado: Usuario): Promise<boolean>;
    usuarioPodeGerenciarItemVendas(usuarioLogado: Usuario): Promise<boolean>;
    usuarioPodeAvaliarItemVendas(usuarioLogado: Usuario): Promise<boolean>;
    usuarioPodeGerenciarProdutos(usuarioLogado: Usuario): Promise<boolean>;
    usuarioPodeGerenciarVendas(usuarioLogado: Usuario): Promise<boolean>;
}

export class AutorizacaoService implements InterfaceAutorizacaoService {

    public async usuarioPodeGerenciarUsuarios(usuarioLogado: Usuario): Promise<boolean> {
        return usuarioLogado.getPerfil() === Perfil.GERENTE;
    }

    public async usuarioPodeGerenciarItemVendas(usuarioLogado: Usuario): Promise<boolean> {
        return usuarioLogado.getPerfil() === Perfil.ATENDENTE || usuarioLogado.getPerfil() === Perfil.CAIXA;
    }

    public async usuarioPodeAvaliarItemVendas(usuarioLogado: Usuario): Promise<boolean> {
        return usuarioLogado.getPerfil() === Perfil.FARMACEUTICO;
    }

    public async usuarioPodeGerenciarProdutos(usuarioLogado: Usuario): Promise<boolean> {
        return usuarioLogado.getPerfil() === Perfil.GERENTE;
    }

    public async usuarioPodeGerenciarVendas(usuarioLogado: Usuario): Promise<boolean> {
        return usuarioLogado.getPerfil() === Perfil.ATENDENTE || usuarioLogado.getPerfil() === Perfil.CAIXA;
    }
    
}
