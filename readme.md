# Apollo Prometheus Plugin ![Tests](https://github.com/thecodenebula/apollo-prometheus-plugin/workflows/Tests/badge.svg)

## Install

`npm install @thecodenebula/apollo-prometheus-plugin`

## Usage

```typescript
import { ApolloServer, gql } from 'apollo-server-express';
import { prometheusPlugin } from 'apollo-prometheus-plugin';
import { Registry } from 'prom-client';
import { prometheusPlugin } from '@thecodenebula/apollo-prometheus-plugin';

const register = new Registry();

const app = express();

app.get('/metrics', (_, res) => res.send(register.metrics()));

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [prometheusPlugin(register, { enableNodeMetrics: true })],
});

server.applyMiddleware({ app, path: '/' });
app.listen({ port: 8080 }, () => {
  console.log('Listening');
});
```