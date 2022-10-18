// basic error type so all our errors have a common type that is cool

export class MrError {
  type: string
  reason: string

  private constructor(type: string, reason: any) {
    this.type = type
    this.reason = String(reason)
  }

  static of(type: string) {
    return (reason?: any) => new MrError(type, reason)
  }
}
