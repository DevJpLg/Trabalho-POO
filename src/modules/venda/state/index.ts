import Venda, { StatusVenda } from "..";
import Usuario from "../../usuario";

export default interface EstadoVenda {
    getStatus(): StatusVenda;

    podeAdicionarItem(venda: Venda, usuarioLogado: Usuario): Promise<boolean>;
    podeRemoverItem(venda: Venda, usuarioLogado: Usuario): Promise<boolean>;
    podeAvaliarVenda(venda: Venda, usuarioLogado: Usuario): Promise<boolean>;

    finalizarVenda(venda: Venda, usuarioLogado: Usuario): Promise<void>;
    cancelarVenda(venda: Venda): Promise<void>;
}