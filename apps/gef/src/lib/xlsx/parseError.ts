export class XlsxParseError extends Error {
  constructor(message: string, public fieldHint?: string) {
    super(message);
    this.name = 'XlsxParseError';
  }
}
