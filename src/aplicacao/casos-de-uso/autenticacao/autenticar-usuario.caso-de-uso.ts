import type { Usuario } from '../../../dominio/entidades/usuario.entidade.js';
import { ErroNaoAutorizado } from '../../../dominio/erros/erros-de-dominio.js';
import type { IUsuarioRepositorio } from '../../../dominio/repositorios/usuario.repositorio.js';
import type { IAuditoriaRepositorio } from '../../../dominio/repositorios/auditoria.repositorio.js';
import type { IHasher } from '../../portas/hasher.js';

export interface EntradaAutenticar {
  email: string;
  senha: string;
}

export class AutenticarUsuarioCasoDeUso {
  constructor(
    private readonly repositorio: IUsuarioRepositorio,
    private readonly hasher: IHasher,
    private readonly auditoria: IAuditoriaRepositorio,
  ) {}

  async executar(entrada: EntradaAutenticar): Promise<Usuario> {
    const usuario = await this.repositorio.buscarPorEmail(entrada.email);

    // 401 genérico: não revelar se o e-mail existe (seguranca.md).
    if (!usuario || !(await this.hasher.comparar(entrada.senha, usuario.senhaHash))) {
      void this.auditoria.registrar({
        tipo: 'sessao.falhou',
        dados: { email: entrada.email },
      });
      throw new ErroNaoAutorizado('Credenciais inválidas');
    }

    void this.auditoria.registrar({ tipo: 'sessao.iniciada', ator: usuario.id });
    return usuario;
  }
}
