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
