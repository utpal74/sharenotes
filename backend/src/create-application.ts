import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

const RAW_JSON_LIMIT = 32 * 1024 * 1024;

function isPayloadTooLarge(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  );
}

export async function createApplication() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const server = app.getHttpAdapter().getInstance();

  server.use(express.json({ limit: RAW_JSON_LIMIT }));
  server.use(express.urlencoded({ extended: true }));
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api/v1');

  server.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      if (isPayloadTooLarge(error)) {
        response.status(413).json({
          statusCode: 413,
          message: 'Request body exceeds the 32 MiB limit',
          error: 'Payload Too Large',
        });
        return;
      }
      next(error);
    },
  );

  await app.init();
  return app;
}
