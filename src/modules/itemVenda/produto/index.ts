import Produto from "../../produto";

export default interface InterfaceConsultaProduto {
    buscarProdutoPorId(id: number): Promise<Produto | null>;
    realizarBaixa(id: number, qtd: number): Promise<boolean>;
    realizarEntrada(produto: Produto, qtd: number): Promise<boolean>;
}