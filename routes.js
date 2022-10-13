import { EventParser, ActionParser } from '@snotra/hasura-parser'

async function hasuraRoutes(fastify, options) {
  /**
   * Provide a way to protect all routes with `x-hasura-from-env` header.
   * If you provide the `api_secret` key in options plugin, all routes will be protected.
   * When protected, you must configure headers of all Hasura events, actions and crons to pass this hook.
   */
  fastify.addHook('onRequest', async request => {
    // Verify api_secret header
    if (
      options.api_secret &&
      request.headers['x-hasura-from-env'] !== options.api_secret
    ) {
      throw fastify.httpErrors.networkAuthenticationRequired(
        "Bad header 'x-hasura-from-env'"
      )
    }
  })

  /**
   * Decorate events and actions requests with hasura-parser.
   * So, you can retrieve and use hasura-parser in routes with `request.event` and `request.action`.
   */
  fastify.decorateRequest('event', null)
  fastify.decorateRequest('action', null)
  // Update properties
  fastify.addHook('preHandler', (request, reply, done) => {
    if (request.body.hasOwnProperty('event'))
      request.event = new EventParser(request.body)

    if (request.body.hasOwnProperty('action'))
      request.action = new ActionParser(request.body)

    done()
  })

  /**
   * Declare events, actions and crons routes.
   */
  fastify.post(`${options.routes_prefix}/events`, (request, reply) => {
    const eventName = request.event.getTriggerName()
    if (fastify.hasura.events[eventName])
      return fastify.hasura.events[eventName](request, reply)

    reply.notFound(`Event ${eventName} not registered`)
  })

  fastify.post(`${options.routes_prefix}/actions`, (request, reply) => {
    const actionName = request.action.getActionName()
    if (fastify.hasura.actions[actionName])
      return fastify.hasura.actions[actionName](request, reply)

    reply.notFound(`Action ${actionName} not registered`)
  })

  fastify.post(`${options.routes_prefix}/crons`, (request, reply) => {
    const cronName = request.body.name
    if (fastify.hasura.crons[cronName])
      return fastify.hasura.crons[cronName](request, reply)

    reply.notFound(`Cron ${cronName} not registered`)
  })
}

export default hasuraRoutes
