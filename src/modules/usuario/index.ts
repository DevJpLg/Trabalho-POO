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

    protected constructor(id: number, nome: string, email: string, senha: string, perfil: Perfil) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.perfil = perfil;
    }

    public getId(): number { return this.id; }
    public getNome(): string { return this.nome; }
    public getEmail(): string { return this.email; }
    public getSenha(): string { return this.senha; }
    public getPerfil(): Perfil { return this.perfil; }

    protected static validarUsuario(nome: string, email: string, senha: string): boolean {
        if(nome === "" || email === "" || senha === "") {
            return false;
        }
        return true;
    }

}
