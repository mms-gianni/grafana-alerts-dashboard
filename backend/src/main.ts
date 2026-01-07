import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS for frontend (development)
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*'),
    credentials: true,
  });

  // Serve static frontend files in production
  const publicPath = join(__dirname, '..', 'public');
  app.useStaticAssets(publicPath);

  const port = configService.get('PORT', 3001);
  await app.listen(port);
  console.log(`🚀 Application running on http://localhost:${port}`);
  console.log(`📁 Serving static files from: ${publicPath}`);
}
bootstrap();
