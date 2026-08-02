import type Usuario from "../modules/usuario";

declare module "express-serve-static-core" {
  interface Request {
    usuario?: Usuario;
  }
}

export {};
