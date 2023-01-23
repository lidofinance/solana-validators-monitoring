import { createMock } from '@golevelup/ts-jest';
import { LoggerModule, nullTransport } from '@lido-nestjs/logger';
import { Test } from '@nestjs/testing';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ConfigModule } from 'common/config';
import { PrometheusModule } from 'common/prometheus/prometheus.module';
import {
  ValidatorKeysModule,
  ValidatorKeysRegistryService,
  ValidatorKeysService,
} from 'common/validator-keys';
import { ValidatorService } from 'storage/validator';

import { InspectorModule, InspectorService } from '../src/inspector';
import { MetricsService } from '../src/metrics';

const DataSourceMockProvider = {
  provide: getDataSourceToken(),
  useValue: createMock<DataSource>({
    entityMetadatas: {
      // `find` used to build repositories providers
      // triggered by forFeature call
      find: () => {
        return;
      },
    } as any,
  }),
};

const TypeOrmStub = {
  global: true, // crucial for DI to work
  module: TypeOrmModule,
  providers: [DataSourceMockProvider],
  exports: [DataSourceMockProvider],
};

describe('Inspector', () => {
  let inspectorService: InspectorService;
  let metricsService: MetricsService;
  let validatorService: ValidatorService;
  let validatorKeysService: ValidatorKeysService;
  let validatorKeysRegistryService: ValidatorKeysRegistryService;

  const mockPreviousInfo = jest.fn().mockImplementation(async () => []);
  const mockSaveToDB = jest
    .fn()
    .mockImplementation(async (validatorsInfo) => validatorsInfo);
  const mockSetMetrics = jest.fn().mockImplementation(async () => []);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot({
          transports: [nullTransport()],
        }),
        TypeOrmStub,
        ConfigModule,
        PrometheusModule,
        ValidatorKeysModule,
        InspectorModule,
      ],
    }).compile();
    inspectorService = moduleRef.get<InspectorService>(InspectorService);
    metricsService = moduleRef.get<MetricsService>(MetricsService);
    validatorService = moduleRef.get<ValidatorService>(ValidatorService);
    validatorKeysService =
      moduleRef.get<ValidatorKeysService>(ValidatorKeysService);
    validatorKeysRegistryService = moduleRef.get<ValidatorKeysRegistryService>(
      ValidatorKeysRegistryService,
    );

    validatorService.lastValidatorsInfo = mockPreviousInfo;
    validatorService.save = mockSaveToDB;
    metricsService.setMetrics = mockSetMetrics;

    await inspectorService.inspect();
  });

  describe('should be processes user validators info from Solana cluster', () => {
    it('saving to DB should be performed only once', () => {
      expect(validatorService.save).toBeCalledTimes(1);
    });

    it('content to save should be non-empty', () => {
      expect(mockSaveToDB.mock.calls.at(0)?.at(0)?.length).toBeGreaterThan(0);
    });

    it('user keys count should be non-empty', () => {
      expect(validatorKeysRegistryService.size).toBeGreaterThan(0);
    });

    it('content to save should contains user validator-keys', () => {
      const toSave = mockSaveToDB.mock.calls.at(0)?.at(0);
      const userToSave = toSave?.filter((v) => v.operator != 'unknown');
      expect(userToSave?.length).toBe(validatorKeysRegistryService.size);
    });
  });
});
