export class ScraperError extends Error {
  public override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
  }
}

export class NetworkError extends ScraperError {}

export class AuthError extends ScraperError {}

export class NotFoundError extends ScraperError {}

export class ParsingError extends ScraperError {
  public readonly context?: unknown;

  constructor(message: string, context?: unknown, cause?: Error) {
    super(message, cause);
    this.context = context;
  }
}
