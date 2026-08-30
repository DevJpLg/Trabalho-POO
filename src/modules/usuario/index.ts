export enum Perfil {
    GERENTE = "GERENTE",
    ATENDENTE = "ATENDENTE",
    FARMACEUTICO = "FARMACEUTICO",
    CAIXA = "CAIXA"
}

export default abstract class Usuario {
    private id: number;
    private nome: string;
    private email: string;
    private senha: string;
    private perfil: Perfil;
    private ehAtivo: boolean;

    protected constructor(id: number, nome: string, email: string, senha: string, perfil: Perfil, ehAtivo: boolean = true) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.perfil = perfil;
        this.ehAtivo = ehAtivo;
    }

    public getId(): number { return this.id; }
    public getNome(): string { return this.nome; }
    public getEmail(): string { return this.email; }
    public getSenha(): string { return this.senha; }
    public getPerfil(): Perfil { return this.perfil; }
    public getEhAtivo(): boolean { return this.ehAtivo; }
    public setEhAtivo(ehAtivo: boolean): void { this.ehAtivo = ehAtivo; }

    protected static validarUsuario(nome: string, email: string, senha: string): boolean {
        if(nome === "" || email === "" || senha === "") {
            return false;
        }
        return true;
    }

}
