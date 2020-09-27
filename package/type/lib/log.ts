export class BaseLog {
  log(msg: string) {
    console.log(msg);
  }

  error(msg: string) {
    console.error(msg);
  }

  warn(msg: string) {
    console.warn(msg);
  }
}
