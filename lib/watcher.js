import logLevel from 'loglevel'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { createServer } from 'http'
import { readBody } from '../utils/http.js'
import mail from './mail_util_loader.js'

const currentScriptDirPath = dirname(fileURLToPath(import.meta.url))
const templatesDir = join(currentScriptDirPath, '..', 'assets', 'mails')
const subjectsFile = join(templatesDir, 'subjects.json')

export default function watch ({
  port,
  mail: {
    key: apiKey,
    from,
    to
  }
}) {
  const log = logLevel.getLogger('lib/watcher')

  const send = mail.createSender({
    apiKey,
    from,
    templatesDir,
    subjectsFile
  })

  const server = createServer(async (request, response) => {
    log.debug('error log request received')

    if (request.method === 'POST') {
      try {
        const message = await readBody(request)

        await send({
          templateId: 'error',
          to,
          params: {
            app: 'heimdall',
            log: message
          }
        })

        response.end('message sent successfully')
      } catch (error) {
        log.error(error)
        response.statusCode = 500
        response.end('error occured while sending log message:\n' + error.message)
      }
    } else {
      response.statusCode = 404
      response.end(request.method + ' method is not supported')
    }
  })

  server.listen(port)

  log.info('listening to error log request on port ' + port)
}
