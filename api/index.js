import server from './server.js'

export default async function handler(req, res) {
  try {
    const response = await server.fetch(req)
    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })
    const body = Buffer.from(await response.arrayBuffer())
    res.end(body)
  } catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Server error',
      }),
    )
  }
}
