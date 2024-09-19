import {
  DynamicModule,
  InternalServerErrorException,
  Logger,
  Module,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ModelDefinition,
  MongooseModule,
  MongooseModuleOptions,
} from '@nestjs/mongoose';

interface DatabaseConnectionString {
  name: string;
  connectionString: string;
  options?: MongooseModuleOptions;
}

@Module({
  providers: [],
  exports: [],
})
export class DatabaseModule extends MongooseModule {
  static dbConnector({
    name,
    connectionString,
    options = {},
  }: DatabaseConnectionString): DynamicModule {
    const logger = new Logger(`${name} DatabaseModule`);

    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forRootAsync({
          useFactory: async (
            configService: ConfigService,
          ): Promise<MongooseModuleOptions> => {
            logger.log(`Attempting to connect to database ${name}`);
            const connectionStringURI =
              configService.get<string>(connectionString);

            if (!connectionStringURI) {
              logger.error(
                `Failed to extract the connection string from the env file`,
              );
              throw new InternalServerErrorException(
                `Unable to connect to database ${name} for given connection string`,
              );
            }

            return {
              uri: connectionStringURI,
              ...options,
            };
          },
          inject: [ConfigService],
        }),
      ],
    };
  }
}
