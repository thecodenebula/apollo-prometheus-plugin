import { ApolloServer, gql } from 'apollo-server';
import { Registry } from 'prom-client';
import { prometheusPlugin } from '../dist';
import { createTestClient } from 'apollo-server-testing';

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

describe('prometheus plugin', () => {
  let register;

  beforeEach(() => {
    register = new Registry();
  });

  it('should  record all basic metrics', async () => {
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      tracing: true,
      plugins: [prometheusPlugin(register, { enableNodeMetrics: true })],
    });

    const { query } = createTestClient(server);

    await query({
      query: gql`
        query getBooks {
          books {
            title
            author
          }
        }
      `,
    });

    expect(register.metrics()).toContain('process_cpu_user_seconds_total');
    expect(register.metrics()).toContain('total_request_time_bucket');
    expect(register.metrics()).toContain('resolver_time_bucket');
    expect(register.metrics()).toContain('attributes_requested');
    expect(register.metrics()).toContain('total_request_time');
    expect(register.metrics()).toContain('attributes_requested{fieldName="books",parentType="Query"} 1');
  });

  it('should not include node metrics when disabled', async () => {
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      tracing: true,
      plugins: [prometheusPlugin(register, { enableNodeMetrics: false })],
    });

    const { query } = createTestClient(server);

    await query({
      query: gql`
        query getBooks {
          books {
            title
            author
          }
        }
      `,
    });

    expect(register.metrics()).not.toContain('process_cpu_user_seconds_total');
  });
});
