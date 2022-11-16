import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { ConfigService } from 'common/config';

export const dbFactory = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  return {
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    database: configService.get('DB_NAME'),
    username: configService.get('DB_USER'),
    password: configService.get('DB_PASSWORD'),
    entities: [__dirname + '/../**/*.entity.ts'],
    autoLoadEntities: true,
    synchronize: true,
  };
};
