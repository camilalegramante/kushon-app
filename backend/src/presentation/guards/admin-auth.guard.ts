import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (!user.roles || !Array.isArray(user.roles)) {
      throw new ForbiddenException('Usuário não possui roles definidas');
    }

    const isAdmin = user.roles.includes('ADMIN');
    if (!isAdmin) {
      throw new ForbiddenException('Acesso restrito. Apenas administradores podem realizar esta ação.');
    }

    return true;
  }
}
