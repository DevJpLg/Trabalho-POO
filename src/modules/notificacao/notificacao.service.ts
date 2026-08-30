import Notificacao from "./index";
import Usuario from "../usuario";
import InterfaceNotificacaoRepository from "./notificacao.repository";
import InterfaceAutorizacaoService from "../usuario/autorizacao/autorizacao.service";
import Subject from "./observer/Subject";

export default interface InterfaceNotificacaoService {
    criarNotificacao(vendaId: number): Promise<Notificacao | Error>;
    listarNotificacoes(usuarioLogado: Usuario): Promise<Notificacao[] | Error>;
    atenderNotificacao(usuarioLogado: Usuario, id: number): Promise<void | Error>;
}

export class NotificacaoService implements InterfaceNotificacaoService {
    constructor(
        private readonly repository: InterfaceNotificacaoRepository,
        private readonly subject: Subject,
        private readonly autorizacaoService: InterfaceAutorizacaoService,
    ) {}

    /* ! ========== Criar notificação compartilhada da venda prescrita ========== */
    public async criarNotificacao(vendaId: number): Promise<Notificacao | Error> {
        try {
            const notificacaoAberta = await this.repository.buscarNotificacaoAbertaPorVendaId(vendaId);
            if (notificacaoAberta !== null) {
                return notificacaoAberta;
            }

            const notificacao = Notificacao.criarNotificacao(vendaId);
            const registrada = await this.repository.registrarNotificacao(notificacao);
            if (!registrada) {
                return new Error("Erro ao registrar notificação");
            }

            await this.subject.notificarObservers(notificacao);
            return notificacao;
        } catch (error) {
            if (error instanceof Error) {
                return error;
            }
            return new Error("Erro ao criar notificação");
        }
    }

    /* ! ========== Listar notificações abertas ========== */
    public async listarNotificacoes(usuarioLogado: Usuario): Promise<Notificacao[] | Error> {
        try {
            if (!(await this.autorizacaoService.usuarioPodeAvaliarItemVendas(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            const resultado = await this.repository.listarNotificacoes();
            return resultado ?? [];
        } catch {
            return new Error("Erro ao listar notificações");
        }
    }

    /* ! ========== Atender notificação (resolve para todos os farmacêuticos) ========== */
    public async atenderNotificacao(usuarioLogado: Usuario, id: number): Promise<void | Error> {
        try {
            if (!(await this.autorizacaoService.usuarioPodeAvaliarItemVendas(usuarioLogado))) {
                return new Error("Usuário não autorizado");
            }

            const notificacao = await this.repository.buscarNotificacaoPorId(id);
            if (notificacao === null) {
                return new Error("Notificação não encontrada");
            }

            notificacao.resolver();

            const resolvida = await this.repository.resolverNotificacao(notificacao);
            if (!resolvida) {
                return new Error("Erro ao atender notificação");
            }
        } catch (error) {
            if (error instanceof Error) {
                return error;
            }
            return new Error("Erro ao atender notificação");
        }
    }
}
