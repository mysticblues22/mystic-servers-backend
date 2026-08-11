export class HttpError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class UnauthorizedError extends HttpError {
  constructor(
    code = "INVALID_REFRESH_TOKEN",
    message = "Invalid or expired refresh token",
  ) {
    super(401, code, message);
  }
}
