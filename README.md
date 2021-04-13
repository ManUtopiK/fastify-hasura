![fastify-hasura.png](https://i.postimg.cc/6qhHHw8K/fastify-hasura.png)

# fastify-hasura

[![NPM version](https://img.shields.io/npm/v/fastify-hasura.svg?style=flat)](https://www.npmjs.com/package/fastify-hasura)
[![Coverage Status](https://coveralls.io/repos/github/ManUtopiK/fastify-hasura/badge.svg?branch=master)](https://coveralls.io/github/ManUtopiK/fastify-hasura?branch=master)

A [Fastify](https://github.com/fastify/fastify) plugin to have fun with [Hasura](https://github.com/hasura/graphql-engine).

## Features

- Fastify decorator over [graphql-request](https://github.com/prisma/graphql-request) to easily request Hasura graphql endpoint.
- Provide routes for Hasura events, actions and cron jobs.
- Secure requests coming from Hasura.
- Easily register handler for Hasura events, actions and cron jobs.

## Install

1. Install fastify-hasura with:

```sh
yarn add fastify-hasura  # or npm i --save fastify-hasura
```

2. Register the plugin:

```js
fastify.register(require('fastify-hasura'), {
  endpoint: 'yourHasuraGraphqlEndpoint',
  admin_secret: 'yourAdminSecret'
})
```

## Usage

**Example request on Hasura Graphql Endpoint**

```js
const userId = 'yourUserUUID'

const fetchUser = `#graphql
  query fetchUser($id: uuid!) {
    user: user_by_pk(id: $id) {
      password
    }
  }
`
const { user } = await fastify.hasura.graphql(fetchUser, {
  id: userId
})
```

**Example registering event and action:**

```js
// Register new_user hasura event
fastify.hasura.registerEvent('new_user', (request, reply) => {
  const user = request.event.getNewData()
  console.log(user)
})

// Register login hasura action
fastify.hasura.registerAction('login', async (request, reply) => {
  const data = request.action.getData('id', 'type', 'user')
  console.log(data)

  const response = await yourAsyncCustomBusinessLogic(data)
  reply.send(response)
})
```

_**Note:** Requests for events and actions are decorated with [hasura-parser](https://github.com/resultdoo/hasura-parser). So, you can easily retrieve data in routes with `request.event` and `request.action`._

### Options

- `endpoint` **[ required ]**: Your Hasura Graphql Endpoint.
- `admin_secret` **[ required ]**: Your Hasura admin secret.
- `api_secret` **[ optional ]**: _Highly recommended._ Provide an api secret if you want to secure requests from your Hasura instance to your Fastify app. You must configure `x-hasura-from-env` headers of all Hasura events, actions and cron jobs with this api secret.
- `routes_prefix` **[ optional ]**: By default, this plugin build root routes for `/events`, `/actions` and `/crons`. Use this option if you want to prefix this routes. Eg: `/hasura` will build routes `/hasura/events` and so on...

**All options:**

```js
fastify.register(require('fastify-hasura'), {
  endpoint: 'yourHasuraGraphqlEndpoint',
  admin_secret: 'yourAdminSecret',
  api_secret: 'yourApiSecret',
  routes_prefix: '/hasura'
})
```

## More documentation

- [Hasura GraphQL Engine Documentation](https://hasura.io/docs/latest/graphql/core/index.html)
- [graphql-request](https://www.npmjs.com/package/graphql-request)
- [hasura-parser](https://github.com/resultdoo/hasura-parser)

## Contributions

If you would like to make any contribution you are welcome to do so.

## License

Licensed under [MIT](https://github.com/ManUtopiK/fastify-hasura/blob/master/LICENSE)
