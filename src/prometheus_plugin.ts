import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';
import {
  ApolloServerPlugin,
  BaseContext,
  GraphQLFieldResolverParams,
  GraphQLRequestContext,
  GraphQLRequestContextDidEncounterErrors,
  GraphQLRequestContextDidResolveOperation,
  GraphQLRequestContextDidResolveSource,
  GraphQLRequestContextExecutionDidStart,
  GraphQLRequestContextParsingDidStart,
  GraphQLRequestContextResponseForOperation,
  GraphQLRequestContextValidationDidStart,
  GraphQLRequestContextWillSendResponse,
  GraphQLRequestExecutionListener,
  GraphQLRequestListener,
  GraphQLRequestListenerDidResolveField,
  GraphQLRequestListenerExecutionDidEnd,
  GraphQLRequestListenerParsingDidEnd,
  GraphQLRequestListenerValidationDidEnd,
  GraphQLResponse,
  GraphQLServiceContext,
  ValueOrPromise,
} from 'apollo-server-plugin-base';
import { filterUndefined } from './utils';

const nanosToSec = 1_000_000_000;

interface PluginConfig {
  enableNodeMetrics: boolean;
}

export default function (register: Registry, config: PluginConfig): ApolloServerPlugin {
  if (config.enableNodeMetrics) {
    collectDefaultMetrics({ register });
  }

  const errorsEncountered = new Counter({
    name: 'errors_encountered',
    help: 'The amount of errors encountered',
    labelNames: ['operationName', 'operation', 'error'],
    registers: [register],
  });

  const resolved = new Counter({
    name: 'requests_resolved',
    help: 'The amount of queries that were resolved',
    labelNames: ['operationName', 'operation'],
    registers: [register],
  });

  const attributesRequested = new Counter({
    name: 'attributes_requested',
    help: 'The fields of each types that were requested',
    labelNames: ['fieldName', 'parentType'],
    registers: [register],
  });

  const totalRequestTime = new Histogram({
    name: 'total_request_time',
    help: 'Time to complete GraphQL request',
    labelNames: ['operationName', 'operation'],
    registers: [register],
  });

  const resolverTime = new Histogram({
    name: 'resolver_time',
    help: 'The time to resolve a GraphQL field.',
    labelNames: ['parentType', 'fieldName', 'returnType'],
    registers: [register],
  });

  return {
    serverWillStart(service: GraphQLServiceContext): ValueOrPromise<void> {},
    requestDidStart(requestContext: GraphQLRequestContext<BaseContext>): GraphQLRequestListener<BaseContext> | void {
      return {
        didEncounterErrors(requestContext: GraphQLRequestContextDidEncounterErrors<BaseContext>): ValueOrPromise<void> {
          const labels = filterUndefined({
            operationName: requestContext.request.operationName,
            operation: requestContext.operation?.operation,
            error: requestContext.errors.map((e) => e.name).join('-'),
          });
          errorsEncountered.inc(labels);
        },
        didResolveOperation(
          requestContext: GraphQLRequestContextDidResolveOperation<BaseContext>
        ): ValueOrPromise<void> {
          const labels = filterUndefined({
            operationName: requestContext.request.operationName,
            operation: requestContext.operation.operation,
          });
          resolved.inc(labels);
        },
        didResolveSource(requestContext: GraphQLRequestContextDidResolveSource<BaseContext>): ValueOrPromise<void> {},
        parsingDidStart(
          requestContext: GraphQLRequestContextParsingDidStart<BaseContext>
        ): GraphQLRequestListenerParsingDidEnd | void {},
        validationDidStart(
          requestContext: GraphQLRequestContextValidationDidStart<BaseContext>
        ): GraphQLRequestListenerValidationDidEnd | void {},
        willSendResponse(requestContext: GraphQLRequestContextWillSendResponse<BaseContext>): ValueOrPromise<void> {
          const labels = filterUndefined({
            operationName: requestContext.request.operationName,
            operation: requestContext.operation?.operation,
          });

          const tracing = requestContext.response.extensions?.tracing;
          if (tracing && tracing.version === 1) {
            totalRequestTime.observe(labels, tracing.duration / nanosToSec);

            tracing.execution.resolvers.forEach(({ parentType, fieldName, returnType, duration }) => {
              resolverTime.observe(
                {
                  parentType,
                  fieldName,
                  returnType,
                },
                duration / nanosToSec
              );
            });
          }
        },
        executionDidStart(
          requestContext: GraphQLRequestContextExecutionDidStart<BaseContext>
        ): GraphQLRequestExecutionListener | GraphQLRequestListenerExecutionDidEnd | void {
          return {
            willResolveField(
              fieldResolverParams: GraphQLFieldResolverParams<any, BaseContext>
            ): GraphQLRequestListenerDidResolveField | void {
              const labels = filterUndefined({
                fieldName: fieldResolverParams.info.fieldName,
                parentType: fieldResolverParams.info.parentType.name,
              });
              attributesRequested.inc(labels);
            },
          };
        },
        responseForOperation(
          requestContext: GraphQLRequestContextResponseForOperation<BaseContext>
        ): ValueOrPromise<GraphQLResponse | null> {
          return null;
        },
      };
    },
  };
}
