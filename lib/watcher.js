import logLevel from 'loglevel'
import Pusher from 'pusher-js'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import mail from './mail_util_loader.js'

const currentScriptDirPath = dirname(fileURLToPath(import.meta.url))
const templatesDir = join(currentScriptDirPath, '..', 'assets', 'mails')
const subjectsFile = join(templatesDir, 'subjects.json')

export default function watch ({
  apis: {
    pusher: pusherApi,
    mail: {
      key: apiKey,
      from,
      to
    }
  }
}) {
  const log = logLevel.getLogger('lib/watcher')
  const pusher = new Pusher(pusherApi.key, { cluster: 'eu' })
  const channel = pusher.subscribe(pusherApi.channel)

  const send = mail.createSender({
    apiKey,
    from,
    templatesDir,
    subjectsFile
  })

  channel.bind('error-log', msg => {
    log.debug('error log event received')

    send({
      templateId: 'error',
      to,
      params: {
        app: 'heimdall',
        log: msg
      }
    })
      .catch(e => log.error(e))
  })
}
