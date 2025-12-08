// Kudos to Papooch - https://github.com/Papooch/nestjs-cls/blob/2803ce67409c493601cc61a3299e7b47d3869c66/packages/core/src/lib/cls-module/feature-detection.utils.ts

export enum HttpAdapterType {
  EXPRESS = "express",
  FASTIFY = "fastify",
}

export function detectHttpAdapterType(httpAdapter: any): HttpAdapterType {
  if (httpAdapter.constructor.name === "FastifyAdapter") {
    return HttpAdapterType.FASTIFY;
  }
  return HttpAdapterType.EXPRESS;
}
