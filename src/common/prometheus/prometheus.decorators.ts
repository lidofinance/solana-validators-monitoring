import { applyDecorators } from '@nestjs/common';
import { Cron, CronOptions } from '@nestjs/schedule';

export enum RequestStatus {
  COMPLETE = 'complete',
  ERROR = 'error',
}

export enum TaskStatus {
  COMPLETE = 'complete',
  ERROR = 'error',
}

export interface NamedCronOptions extends CronOptions {
  name: string;
}

/**
 * Decorator for track requests. 'promService' should be present in constructor
 */
export function TrackableRequest(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  // https://stackoverflow.com/a/69082407
  const originalValue = descriptor.value;

  descriptor.value = function (...args: any[]) {
    // "this" here will refer to the class instance
    if (!this.promService)
      throw Error(
        `'${this.constructor.name}' class object must contain 'promService' property`,
      );
    const connection = args.at(-1)?.connection ?? this.connection;
    const targetName = new URL(connection.rpcEndpoint).hostname;
    const stop = this.promService.outgoingRPCRequestsDuration.startTimer({
      name: propertyKey,
      target: targetName,
      status: RequestStatus.COMPLETE,
    });

    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request ${propertyKey} timed out`));
      }, 60000);
    });
    return Promise.race([originalValue.apply(this, args), timeout])
      .then((r) => {
        this.logger.debug(
          `Request '${propertyKey}' is complete. Duration: ${stop()}`,
        );
        this.promService.outgoingRPCRequestsCount.inc({
          name: propertyKey,
          target: targetName,
          status: RequestStatus.COMPLETE,
        });
        return r;
      })
      .catch((e) => {
        stop();
        this.logger.error(
          `Request '${propertyKey}' ended with an error`,
          e.stack,
        );
        this.promService.outgoingRPCRequestsCount.inc({
          name: propertyKey,
          target: targetName,
          status: RequestStatus.ERROR,
        });
        throw e;
      });
  };
}

/**
 * Decorator for track cron tasks. 'promService' should be present in constructor
 */
export function TrackableCron(
  cronTime: string | Date,
  options: NamedCronOptions,
) {
  return applyDecorators(TrackableTask(options.name), Cron(cronTime, options));
}

const inProgress = {};

function TrackableTask(name: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // https://stackoverflow.com/a/69082407
    const originalValue = descriptor.value;

    descriptor.value = function () {
      // "this" here will refer to the class instance
      if (!this.promService)
        throw Error(
          `'${this.constructor.name}' class object must contain 'promService' property`,
        );
      if (inProgress[name]) {
        this.logger.warn(
          `Task '${name}' now in progress. Unable to run the same`,
        );
        return;
      }
      inProgress[name] = true;
      const stop = this.promService.taskDuration.startTimer({
        name: name,
      });
      this.logger.debug(`Task '${name}' in progress`);
      return originalValue
        .apply(this)
        .then((r) => {
          this.logger.debug(`Task '${name}' is complete. Duration: ${stop()}`);
          this.promService.taskCount.inc({
            name: name,
            status: TaskStatus.COMPLETE,
          });
          return r;
        })
        .catch((e) => {
          stop();
          this.logger.error(`Task '${name}' ended with an error`, e.stack);
          this.promService.taskCount.inc({
            name: name,
            status: TaskStatus.ERROR,
          });
          throw e;
        })
        .finally(() => (inProgress[name] = false));
    };
  };
}
