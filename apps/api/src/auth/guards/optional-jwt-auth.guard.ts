import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Guard opcional que so valida JWT quando o header Authorization existe.
 * Mantem rotas publicas acessiveis e ainda popula req.user para admins/instrutores.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const hasAuthorization = Boolean(request.headers?.authorization);

    if (!hasAuthorization) {
      // Sem token -> segue como publico
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || info) {
      // Token invalido -> trata como requisição publica
      return null;
    }

    return user ?? null;
  }
}
