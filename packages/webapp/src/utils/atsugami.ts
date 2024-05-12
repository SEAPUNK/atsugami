export type TimeoutId = ReturnType<typeof setTimeout>;
export type IntervalId = ReturnType<typeof setInterval>;

export function toTagList(searchTags: string) {
  return [...new Set(searchTags.split(" "))];
}

export function blurAllInputs() {
  document
    .querySelectorAll("input:focus")
    .forEach((input) => (input as HTMLInputElement).blur());
  document
    .querySelectorAll("textarea:focus")
    .forEach((input) => (input as HTMLTextAreaElement).blur());
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export class MouseMovementCounter {
  public totalDelta: number = 0;
  private _timers = new Set<TimeoutId>();

  constructor(public duration: number = 500) {}

  add(movementX: number, movementY: number) {
    let delta = Math.abs(movementX) + Math.abs(movementY);
    this.totalDelta += delta;
    let timerId = setTimeout(() => {
      this.totalDelta -= delta;
      this._timers.delete(timerId);
    }, this.duration);
    this._timers.add(timerId);
  }

  reset() {
    for (let timer of this._timers) {
      this._timers.delete(timer);
      clearTimeout(timer);
    }
    this.totalDelta = 0;
  }
}

export function assertUnreachable(x: never): never {
  throw new Error(`Didn't expect to get here: ${x}`);
}
