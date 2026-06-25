import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import type { IncomingMessage, ServerResponse } from 'http';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const express: any = require('express');
const expressServer = express();
let initialized = false;

async function setup() {
  if (initialized) return;
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressServer), {
    logger: ['error', 'warn'],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.init();
  initialized = true;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await setup();
  expressServer(req, res);
}
