const { Client } = require('pg')

module.exports.handler = async () => {
  try {
    const client = new Client({
      host: process.env.DB_HOSTNAME,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
    })

    await client.connect()

    const tableExists = await client
      .query('SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = \'public\' AND tablename  = \'imgs\');')
      .then((result) => result.rows[0].exists)

    if (tableExists) {
      const result = await client.query('SELECT * FROM public.imgs')
      await client.end()
      return response(200, { imgs: result.rows })
    }

    await client.query(` 
      CREATE TABLE public.imgs (id serial, key text NOT NULL, src text NOT NULL);
    `)

    await client.end()

    return response(200, { imgs: [] })
  } catch (error) {
    return response(500, error)
  }
};

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