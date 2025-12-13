import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString =
      process.env.ENVIRONMENT === 'prod' || process.env.ENVIRONMENT === 'stag'
        ? process.env.DATABASE_URL
        : 'postgresql://postgres:devpassword@localhost:5432/edc_portal';

    if (!connectionString) {
      throw new Error('Database connection string is not configured');
    }

    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }
}
