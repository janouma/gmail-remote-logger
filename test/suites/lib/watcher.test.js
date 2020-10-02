/* eslint-env jest */

import Pusher from 'pusher-js'
import mail from '../../../lib/mail_util_loader'
import watch from '../../../lib/watcher'

jest.mock('pusher-js', () => jest.fn().mockName('Pusher'))

jest.mock('../../../lib/mail_util_loader', () => ({
  createSender: jest.fn().mockName('createSender')
}))

const env = {
  apis: {
    pusher: {
      key: 'guyglhiuhmojmi',
      channel: 'heimdall-chan'
    },
    mail: {
      key: '_uiqsgdugqsdhis5678==',
      from: 'no-reply@heimdall.fr',
      to: 'admin@eimdall.fr'
    }
  }
}

const mockChannel = {
  bind: jest.fn().mockName('bind')
}

const mockPusherInstance = {
  subscribe: jest.fn(() => mockChannel)
    .mockName('subscribe')
}

Pusher.mockImplementation(() => mockPusherInstance)

const mockSend = jest.fn()
  .mockResolvedValue()
  .mockName('send')

mail.createSender.mockReturnValue(mockSend)

describe('lib/watcher', () => {
  it('should send log mail on "error-log" event', () => {
    watch(env)

    expect(Pusher).toHaveBeenCalledWith(
      env.apis.pusher.key,
      { cluster: 'eu' }
    )

    expect(mockPusherInstance.subscribe).toHaveBeenCalledWith(env.apis.pusher.channel)
    expect(mockChannel.bind).toHaveBeenCalledWith('error-log', expect.any(Function))

    const projectDirPattern = '^.+/' + process.env.npm_package_name

    expect(mail.createSender).toHaveBeenCalledWith({
      apiKey: env.apis.mail.key,
      from: env.apis.mail.from,
      templatesDir: expect.stringMatching(new RegExp(projectDirPattern + '/assets/mails$')),
      subjectsFile: expect.stringMatching(new RegExp(projectDirPattern + '/assets/mails/subjects.json$'))
    })

    const { calls: [[/* event */, sendLog]] } = mockChannel.bind.mock
    const logMsg = 'log message'
    sendLog(logMsg)

    expect(mockSend).toHaveBeenCalledWith({
      templateId: 'error',
      to: env.apis.mail.to,

      params: {
        app: 'heimdall',
        log: logMsg
      }
    })
  })
})
