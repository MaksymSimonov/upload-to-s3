const { Client } = require('pg')

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body)
    const { userId } = body
    if (!userId) {
      return response(400, 'You must specify userId')
    }

    const client = new Client({
      host: process.env.DB_HOSTNAME,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
    })

    await client.connect()

    const tableExists = await client
      .query('SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = \'public\' AND tablename  = \'users\');')
      .then((result) => result.rows[0].exists)

    if (!tableExists) {
      await client.query(`
        CREATE TABLE public.users (id TEXT PRIMARY KEY, password TEXT NOT NULL);
      `)
    }

    const result = await client.query(`
      DELETE FROM public.users WHERE id = '${userId}' RETURNING *;
    `)

    await client.end()

    return response(200, { deleted: result.rows })
  } catch (error) {
    return response(500, error)
  }
}

const response = (responseCode, message) => ({
  statusCode: responseCode,
  body: JSON.stringify(responseCode === 200
    ? {
      ...message,
    }
    : {
      message,
    },
  null,
  2),
})