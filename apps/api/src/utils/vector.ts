export function toPgVector(values: number[]): string {
  if (!values.length) {
    throw new Error("Cannot serialize empty vector");
  }

  return `[${values.join(",")}]`;
}
