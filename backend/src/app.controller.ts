import { Controller, Get, Res, Req, Next } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Catch-all route for SPA - serve index.html for all non-API routes
  @Get('*')
  serveSPA(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    // Skip for API routes - let them 404 properly
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  }
}
