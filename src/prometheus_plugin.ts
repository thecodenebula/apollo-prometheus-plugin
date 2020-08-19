import { Registry, collectDefaultMetrics } from 'prom-client';
import {
  ApolloServerPlugin,
  BaseContext,
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
  GraphQLRequestListenerExecutionDidEnd,
  GraphQLRequestListenerParsingDidEnd,
  GraphQLRequestListenerValidationDidEnd,
  GraphQLResponse,
  GraphQLServiceContext,
  ValueOrPromise,
} from 'apollo-server-plugin-base';

interface PluginConfig {
  enableNodeMetrics: boolean;
}

export default function (register: Registry, config: PluginConfig): ApolloServerPlugin {
  if (config.enableNodeMetrics) {
    collectDefaultMetrics({ register });
  }

  return {
    serverWillStart(service: GraphQLServiceContext): ValueOrPromise<void> {},
    requestDidStart(requestContext: GraphQLRequestContext<BaseContext>): GraphQLRequestListener<BaseContext> | void {
      return {
        didEncounterErrors(
          requestContext: GraphQLRequestContextDidEncounterErrors<BaseContext>
        ): ValueOrPromise<void> {},
        didResolveOperation(
          requestContext: GraphQLRequestContextDidResolveOperation<BaseContext>
        ): ValueOrPromise<void> {},
        didResolveSource(requestContext: GraphQLRequestContextDidResolveSource<BaseContext>): ValueOrPromise<void> {
          console.log(requestContext.operation);
        },
        parsingDidStart(
          requestContext: GraphQLRequestContextParsingDidStart<BaseContext>
        ): GraphQLRequestListenerParsingDidEnd | void {},
        validationDidStart(
          requestContext: GraphQLRequestContextValidationDidStart<BaseContext>
        ): GraphQLRequestListenerValidationDidEnd | void {},
        willSendResponse(requestContext: GraphQLRequestContextWillSendResponse<BaseContext>): ValueOrPromise<void> {},
        executionDidStart(
          requestContext: GraphQLRequestContextExecutionDidStart<BaseContext>
        ): GraphQLRequestExecutionListener | GraphQLRequestListenerExecutionDidEnd | void {},
        responseForOperation(
          requestContext: GraphQLRequestContextResponseForOperation<BaseContext>
        ): ValueOrPromise<GraphQLResponse | null> {
          return null;
        },
      };
    },
  };
}
