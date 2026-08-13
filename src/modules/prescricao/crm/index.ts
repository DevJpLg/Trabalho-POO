export default interface InterfaceCrmService {
    validarCrm(numeroCrm: string, ufCrm: string): Promise<boolean | Error>;
}