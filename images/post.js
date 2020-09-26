const { Client } = require('pg')

module.exports.handler = async (event) => {
  try {
    const userId = event['pathParameters']['userId']
    const body = JSON.parse(event.body)
    const { key, src } = body

    if (!key || !src) {
      return response(400, 'You must specify key and src')
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
      .query('SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = \'public\' AND tablename  = \'images\');')
      .then((result) => result.rows[0].exists)

    if (!tableExists) {
      await client.query(`
        CREATE TABLE public.images (
          id SERIAL, userId TEXT NOT NULL, key TEXT NOT NULL, src TEXT NOT NULL, FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
        );
      `)
    }

    const result = await client.query(`
      INSERT INTO public.images (userId, key, src) VALUES ('${userId}', '${key}', '${src}') RETURNING *;
    `)

    await client.end()

    return response(200, { saved: result.rows })
  } catch (error) {
    return response(500, error.message)
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