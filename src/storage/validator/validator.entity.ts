import { Column, Entity, Index } from 'typeorm';

export enum Status {
  ONLINE = 'online',
  OFFLINE = 'offline',
  OUT_OF_EPOCH = 'out_of_epoch', // no activity in current epoch
}

@Entity()
export class Validator {
  @Index()
  @Column({ type: 'bigint', primary: true })
  fetchTimestamp!: number;

  @Column({ type: 'varchar', length: 44, primary: true })
  pubkey!: string;

  @Index()
  @Column({ type: 'bigint' })
  epoch?: number;

  @Column({ type: 'decimal', nullable: true })
  skipRate?: number;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  version?: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  prevVersion?: string;

  @Index()
  @Column({ type: 'enum', enum: Status })
  status?: Status;

  @Column({ type: 'bigint', nullable: true })
  lastVote?: number;

  @Column({ type: 'bigint', nullable: true })
  voteDistance?: number;

  @Column({ type: 'bigint', nullable: true })
  downtime?: number;

  @Column({ type: 'bigint', nullable: true })
  updateTime?: number;

  @Index()
  @Column({ type: 'varchar', default: 'unknown' })
  operator?: string;
}
