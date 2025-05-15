import { HttpServer } from '@nestjs/common';
import { detectHttpAdapterType, HttpAdapterType } from './feature-detection.utils';

const MOUNT_POINT_EXPRESS_5 = '/';
const MOUNT_POINT_FASTIFY_5 = '{*path}';

export function getMiddlewareMountPoint(adapter: HttpServer): string {
  const httpAdapterType = detectHttpAdapterType(adapter);
  if (httpAdapterType === HttpAdapterType.FASTIFY) {
    return MOUNT_POINT_FASTIFY_5;
  } else {
    return MOUNT_POINT_EXPRESS_5;
  }
}
