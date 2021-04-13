import tap from 'tap'
import axios from 'axios'
import buildFastify from '../../../app.js'

tap.test('hasura', async t => {
  const fastify = buildFastify()

  await fastify.ready()

  // Test hasura plugin correctly loaded
  t.type(
    fastify.hasura.graphql,
    'function',
    'fastify.hasura.graphql is function'
  )

  // Test hasura endpoint health response
  const endpoint = fastify.configHasura.HASURA_GRAPHQL_ENDPOINT
  const { data } = await axios.get(endpoint.replace('v1/graphql', 'healthz'))
  t.equal(data, 'OK', `${endpoint} healthy`)

  // Throw nice error
  try {
    await fastify.hasura.graphql(
      `#graphql
      query test {
        test
      }
    `
    )
  } catch (err) {
    t.equal(err.statusCode, 400, 'Return statusCode 400')
    t.equal(
      err.message,
      `field "test" not found in type: 'query_root'`,
      'Throw nice error'
    )
  }

  await fastify.close()
})
