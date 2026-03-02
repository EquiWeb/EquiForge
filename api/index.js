import server from './server.js'
import { toNodeHandler } from 'srvx/node'

export default toNodeHandler(server.fetch)
