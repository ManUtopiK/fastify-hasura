import fp from 'fastify-plugin'
import { GraphQLClient } from 'graphql-request'

import hasuraRoutes from './routes.js'

function fastifyHasura(fastify, options, done) {
  // Register fastify-sensible for handling errors in routes.
  fastify.register(import('fastify-sensible'))

  // Check options
  if (!options.endpoint) throw new Error('You must provide hasura endpoint')
  if (!options.admin_secret)
    throw new Error('You must provide hasura admin secret')
  if (!options.routes_prefix) options.routes_prefix = ''

  // Provide fake graphql Hasura endpoint for testing
  // if (fastify.config.NODE_ENV === 'test' && env.HASURA_GRAPHQL_TEST_ENDPOINT)
  //   env.HASURA_GRAPHQL_ENDPOINT = env.HASURA_GRAPHQL_TEST_ENDPOINT

  // Ugly error come from graphql-request! See here https://github.com/prisma-labs/graphql-request/blob/777cc55f3f772f5b527df4b7b4ae5f66006b30e9/src/types.ts#L29
  // TODO Implement formatter ? https://github.com/mercurius-js/mercurius/blob/master/lib/errors.js
  class ErrorHasura extends Error {
    constructor({ message }) {
      const err = message.split(': {"resp')
      const { response, request } = JSON.parse(
        `{"resp${err[1]}`
          .replace(/\n/g, '')
          .replace(/field "(.*)" not/, "field '$1' not")
      )
      super(err[0])
      this.query = request.query
      this.variables = request.variables
      this.extensions = response.errors[0].extensions
      this.statusCode = 200
    }
  }

  // Create graphql client.
  const graphql_client = new GraphQLClient(options.endpoint, {
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': options.admin_secret
    }
  })

  fastify.decorate('hasura', {
    /**
     * Provide `fastify.hasura.graphql` function to make request on Hasura graphql endpoint.
     * @param {String} query Graphql query in AST format. Eg: gql`query...`
     * @param {Object} variables Variables passed to the query.
     * @return Object Response from Hasura instance.
     */
    graphql: async (query, variables) => {
      try {
        const hasura_data = await graphql_client.request(query, variables)

        // check if we got any response back
        if (hasura_data.length === 0) {
          throw new Error('Invalid request')
        }

        return hasura_data
      } catch (err) {
        throw new ErrorHasura(err)
      }
    },

    /**
     * Register events
     */
    events: {},
    registerEvent: (event, func) => {
      fastify.hasura.events[event] = func
    },

    /**
     * Register actions
     */
    actions: {},
    registerAction: (action, func) => {
      fastify.hasura.actions[action] = func
    },

    /**
     * Register crons
     */
    crons: {},
    registerCron: (cron, func) => {
      fastify.hasura.crons[cron] = func
    }
  })

  /**
   * Register routes `/events`, `/actions` and `/crons`
   */
  fastify.register(hasuraRoutes, options)

  done()
}

export default fp(fastifyHasura, {
  fastify: '>=2.11.0',
  name: 'fastify-hasura'
})
