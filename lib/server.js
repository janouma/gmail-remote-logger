import logLevel from 'loglevel'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { createServer } from 'http'
import { readBody } from '../utils/http.js'
import mail from './mail_util_loader.js'

const currentScriptDirPath = dirname(fileURLToPath(import.meta.url))
const templatesDir = join(currentScriptDirPath, '..', 'assets', 'mails')
const subjectsFile = join(templatesDir, 'subjects.json')

export default function serve ({
  port,
  mail: {
    key: apiKey,
    from,
    to
  },
  allowOrigin
}) {
  const log = logLevel.getLogger('lib/server')

  const send = mail.createSender({
    apiKey,
    from,
    templatesDir,
    subjectsFile
  })

  const server = createServer(async (request, response) => {
    log.debug('error log request received')

    const {
      headers: { origin = request.headers.Origin },
      method
    } = request

    log.debug('origin:', origin)

    if (
      method === 'POST' &&
      ((allowOrigin === '*' && origin) || (allowOrigin && origin === allowOrigin))
    ) {
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
      response.statusCode = 400
      response.end(`Bad request:\nmethod: ${method}\norigin: ${origin}\nallowOrigin: ${allowOrigin}`)
    }
  })

  server.listen(port)

  log.info('listening to error log request on port ' + port)
}
