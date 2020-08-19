import { ApolloServer, gql } from 'apollo-server-express';
import { prometheusPlugin } from 'apollo-prometheus-plugin';
import { Registry } from 'prom-client';
// @ts-ignore
import express from 'express';

const typeDefs = gql`
  type Book {
    title: String
    author: String
  }

  type Query {
    books: [Book]
  }
`;

const books = [
  {
    title: 'Harry Potter and the Chamber of Secrets',
    author: 'J.K. Rowling',
  },
  {
    title: 'Jurassic Park',
    author: 'Michael Crichton',
  },
];

const resolvers = {
  Query: {
    books: () => books,
  },
};

const register = new Registry();

const app = express();

app.get('/metrics', (_, res) => res.send(register.metrics()));

const server = new ApolloServer({
  typeDefs,
  resolvers,
  tracing: true,
  introspection: true,
  playground: true,
  plugins: [prometheusPlugin(register, { enableNodeMetrics: true })],
});

server.applyMiddleware({ app, path: '/' });
app.listen({ port: 8080 }, () => {
  console.log('Listening');
});
