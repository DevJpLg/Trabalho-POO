export enum StatusVenda {
    EM_ANDAMENTO = "EM_ANDAMENTO",
    EM_AVALIACAO = "EM_AVALIACAO",
    AGUARDANDO_PAGAMENTO = "AGUARDANDO_PAGAMENTO",
    FINALIZADA = "FINALIZADA",
    CANCELADA = "CANCELADA"
}
export { VendaController } from "./venda.controller";
export { VendaService } from "./venda.service";
export { VendaRepository } from "./venda.repository";
export { vendaRoutes } from "./venda.routes";
