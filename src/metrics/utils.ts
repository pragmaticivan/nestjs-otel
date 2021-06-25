/**
 * @public
 */
export function getToken(name: string): string {
  return `OTEL_METRIC_${name.toUpperCase()}`;
}
