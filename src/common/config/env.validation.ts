import { Transform, plainToClass } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

import { Environment, LogFormat, LogLevel } from './interfaces';

const toNumber =
  ({ defaultValue }) =>
  ({ value }) => {
    if (value === '' || value == null) return defaultValue;
    return Number(value);
  };

const toBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return !!value;
  }

  if (!(typeof value === 'string')) {
    return false;
  }

  switch (value.toLowerCase().trim()) {
    case 'true':
    case 'yes':
    case '1':
      return true;
    case 'false':
    case 'no':
    case '0':
    case null:
      return false;
    default:
      return false;
  }
};

export enum ValidatorsListSource {
  Lido = 'lido',
  File = 'file',
}

export enum LidoProgramInstances {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.development;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(toNumber({ defaultValue: 3000 }))
  PORT: number;

  @IsOptional()
  @IsEnum(LogLevel)
  @Transform(({ value }) => value || LogLevel.info)
  LOG_LEVEL: LogLevel;

  @IsOptional()
  @IsEnum(LogFormat)
  @Transform(({ value }) => value || LogFormat.json)
  LOG_FORMAT: LogFormat;

  @IsArray()
  @ArrayMinSize(1)
  @Transform(({ value }) =>
    value.split(',').map((u) => (u.endsWith('/') ? u.slice(0, -1) : u)),
  )
  public RPC_URLS!: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBoolean(value), { toClassOnly: true })
  public RPC_HEALTH_CHECK = true;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(toNumber({ defaultValue: 0 }))
  KEEP_IN_STORAGE_DAYS: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBoolean(value), { toClassOnly: true })
  public DRY_RUN = false;

  @IsEnum(ValidatorsListSource)
  public VALIDATORS_LIST_SOURCE: ValidatorsListSource =
    ValidatorsListSource.Lido;

  @IsEnum(LidoProgramInstances)
  public VALIDATORS_LIST_LIDO_PROGRAM_INSTANCE: LidoProgramInstances =
    LidoProgramInstances.Mainnet;

  @IsString()
  public VALIDATORS_LIST_FILE_SOURCE_PATH =
    './docker/validators/validators.yaml';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(toNumber({ defaultValue: 0 }))
  DB_PORT: number;

  @IsOptional()
  @IsString()
  DB_HOST: string;

  @IsOptional()
  @IsString()
  DB_USER!: string;

  @IsOptional()
  @IsString()
  DB_PASSWORD!: string;

  @IsOptional()
  @IsString()
  DB_NAME!: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config);

  const validatorOptions = { skipMissingProperties: false };
  const errors = validateSync(validatedConfig, validatorOptions);

  if (errors.length > 0) {
    console.error(errors.toString());
    process.exit(1);
  }

  return validatedConfig;
}
