import Usuario, { Perfil } from "../index";

export default interface InterfaceAutorizacaoService {
    usuarioPodeGerenciarUsuarios(usuarioLogado: Usuario): Promise<boolean>;
    usuarioPodeGerenciarItemVendas(usuarioLogado: Usuario): Promise<boolean>;
    usuarioPodeAvaliarItemVendas(usuarioLogado: Usuario): Promise<boolean>;
    usuarioPodeGerenciarProdutos(usuarioLogado: Usuario): Promise<boolean>;
    usuarioPodeGerenciarVendas(usuarioLogado: Usuario): Promise<boolean>;
    usuarioPodeListarProdutos(usuarioLogado: Usuario): Promise<boolean>;
    usuarioPodeGerenciarValidades(usuarioLogado: Usuario): Promise<boolean>;
    usuarioPodeBloquearProdutos(usuarioLogado: Usuario): Promise<boolean>;
}

export class AutorizacaoService implements InterfaceAutorizacaoService {

    public async usuarioPodeGerenciarUsuarios(usuarioLogado: Usuario): Promise<boolean> {
        return usuarioLogado.getPerfil() === Perfil.GERENTE;
    }

    public async usuarioPodeGerenciarItemVendas(usuarioLogado: Usuario): Promise<boolean> {
        return usuarioLogado.getPerfil() === Perfil.ATENDENTE || 
               usuarioLogado.getPerfil() === Perfil.CAIXA || 
               usuarioLogado.getPerfil() === Perfil.FARMACEUTICO;
    }

    public async usuarioPodeAvaliarItemVendas(usuarioLogado: Usuario): Promise<boolean> {
        return usuarioLogado.getPerfil() === Perfil.FARMACEUTICO;
    }

    public async usuarioPodeGerenciarProdutos(usuarioLogado: Usuario): Promise<boolean> {
        return usuarioLogado.getPerfil() === Perfil.GERENTE;
    }

    public async usuarioPodeGerenciarPrescricoes(usuarioLogado: Usuario): Promise<boolean> {
        return usuarioLogado.getPerfil() === Perfil.FARMACEUTICO;
    }

    public async usuarioPodeBloquearProdutos(usuarioLogado: Usuario): Promise<boolean> {
        return usuarioLogado.getPerfil() === Perfil.FARMACEUTICO || usuarioLogado.getPerfil() === Perfil.GERENTE;
    }

    public async usuarioPodeAvaliarProdutos(usuarioLogado: Usuario): Promise<boolean> {
        return usuarioLogado.getPerfil() === Perfil.FARMACEUTICO;
    }

    public async usuarioPodeListarProdutos(usuarioLogado: Usuario): Promise<boolean> {
        return usuarioLogado.getPerfil() === Perfil.FARMACEUTICO || usuarioLogado.getPerfil() === Perfil.GERENTE;
    }
    
    public async usuarioPodeGerenciarVendas(usuarioLogado: Usuario): Promise<boolean> {
        const perfil = usuarioLogado.getPerfil();
        return (
            perfil === Perfil.ATENDENTE ||
            perfil === Perfil.CAIXA ||
            perfil === Perfil.FARMACEUTICO
        );
    }
    
    public async usuarioPodeGerenciarValidades(usuarioLogado: Usuario): Promise<boolean> {
        return usuarioLogado.getPerfil() === Perfil.FARMACEUTICO;
    }
}
