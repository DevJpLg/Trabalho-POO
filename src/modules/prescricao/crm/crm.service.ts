import InterfaceCrmService from "./index";

export default class CrmService implements InterfaceCrmService {

    public async validarCrm(numeroCrm: string, ufCrm: string): Promise<boolean | Error> {
        try {
            const params = new URLSearchParams({
                tipo: "crm",
                q: numeroCrm,
                chave: process.env.CONSULTAR_IO_TOKEN ?? "",
                destino: "xml",
            });

            const resposta = await fetch( `https://www.consultacrm.com.br/api/index.php?${params.toString()}` );
            if (!resposta.ok) {
                return new Error("Erro ao validar CRM");
            }

            const xml = await resposta.text();
            const itens = this.lerItens(xml);
            if (itens.length === 0) {
                return new Error("CRM inexistente");
            }

            const uf = ufCrm.trim().toUpperCase();
            const item = itens.find((crm) => crm.uf.toUpperCase() === uf);
            if (!item) {
                return new Error("UF do CRM inválida");
            }
            if (item.situacao.toLowerCase() !== "ativo") {
                return new Error("CRM inativo");
            }

            return true;

        } catch (error) {
            return new Error("Erro ao validar CRM");
        }
    }

    private lerTag(xml: string, tag: string): string | undefined {
        return xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, "i"))?.[1]?.trim();
    }

    private lerItens(xml: string): { uf: string; situacao: string }[] {
        return xml.split(/<item>/i).slice(1).map((item) => ({
            uf: this.lerTag(item, "uf") ?? "",
            situacao: this.lerTag(item, "situacao") ?? "",
        }));
    }
}
