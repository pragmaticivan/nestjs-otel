import { HttpServer } from '@nestjs/common';
import {
  detectHttpAdapterTypeAndVersion,
  ExpressVersion,
  FastifyVersion,
  HttpAdapterType,
} from './feature-detection.utils';

const MOUNT_POINT_EXPRESS_5 = '/';
const MOUNT_POINT_EXPRESS_4 = '*';

const MOUNT_POINT_FASTIFY_5 = '{*path}';
const MOUNT_POINT_FASTIFY_4 = '(.*)';

export function getMiddlewareMountPoint(adapter: HttpServer): string {
  const features = detectHttpAdapterTypeAndVersion(adapter);
  if (features.adapterType === HttpAdapterType.FASTIFY) {
    if (features.version === FastifyVersion.V5) {
      return MOUNT_POINT_FASTIFY_5;
    }
    return MOUNT_POINT_FASTIFY_4;
  } else {
    if (features.version === ExpressVersion.V5) {
      return MOUNT_POINT_EXPRESS_5;
    }
    return MOUNT_POINT_EXPRESS_4;
  }
}
