// Kudos to Papooch - https://github.com/Papooch/nestjs-cls/blob/2803ce67409c493601cc61a3299e7b47d3869c66/packages/core/src/lib/cls-module/feature-detection.utils.ts
import { HttpServer } from '@nestjs/common';

export enum ExpressVersion {
  V4 = '4.x',
  V5 = '5.x',
}

export enum FastifyVersion {
  V4 = '4.x',
  V5 = '5.x',
}

export enum HttpAdapterType {
  EXPRESS = 'express',
  FASTIFY = 'fastify',
}

type HttpExpresAdapterResponse = {
  adapterType: HttpAdapterType.EXPRESS;
  version: ExpressVersion;
};

type HttpFastifyAdapterResponse = {
  adapterType: HttpAdapterType.FASTIFY;
  version: FastifyVersion;
};

type HttpAdapterTypeAndVersion = HttpExpresAdapterResponse | HttpFastifyAdapterResponse;

export function detectHttpAdapterTypeAndVersion(
  httpAdapter: HttpServer
): HttpAdapterTypeAndVersion {
  const adapterType = detectHttpAdapterType(httpAdapter);
  if (adapterType === HttpAdapterType.FASTIFY) {
    return {
      adapterType: HttpAdapterType.FASTIFY,
      version: detectFastifyVersion(httpAdapter.getInstance()),
    };
  } else {
    return {
      adapterType: HttpAdapterType.EXPRESS,
      version: detectExpressVersion(httpAdapter.getInstance()),
    };
  }
}

function detectHttpAdapterType(httpAdapter: any): HttpAdapterType {
  if (httpAdapter.constructor.name === 'FastifyAdapter') {
    return HttpAdapterType.FASTIFY;
  }
  return HttpAdapterType.EXPRESS;
}

function detectExpressVersion(expressApp: any): ExpressVersion {
  // feature detection based on https://expressjs.com/en/guide/migrating-5.html
  if (
    // app.del is removed in Express 5
    typeof expressApp.del === 'undefined'
  ) {
    return ExpressVersion.V5;
  }
  return ExpressVersion.V4;
}

function detectFastifyVersion(fastifyApp: any): FastifyVersion {
  // feature detection based on https://fastify.dev/docs/v5.1.x/Guides/Migration-Guide-V5/
  if (
    // these methods are removed in Fastify 5
    typeof fastifyApp.getDefaultRoute === 'undefined' &&
    typeof fastifyApp.setDefaultRoute === 'undefined'
  ) {
    return FastifyVersion.V5;
  }
  return FastifyVersion.V4;
}
