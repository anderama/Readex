// Erro de negócio com status HTTP e mensagem pronta para a interface
export class AppError extends Error {
  constructor(public statusCode: number, message: string, public field?: string) {
    super(message)
  }
}

export const notFound = (what = 'Recurso') => new AppError(404, `${what} não encontrado.`)
