/* eslint-env jest */

import { createServer } from 'http'
import { promisify } from 'util'
import mail from '../../../lib/mail_util_loader'
import watch from '../../../lib/watcher'
import { readBody } from '../../../utils/http'

jest.mock('http', () => ({
  createServer: jest.fn().mockName('createServer')
}))

jest.mock('../../../lib/mail_util_loader', () => ({
  createSender: jest.fn().mockName('createSender')
}))

jest.mock('../../../utils/http', () => ({
  readBody: jest.fn().mockName('readBody')
}))

const nextTick = promisify(process.nextTick)

const env = {
  port: 4653,
  mail: {
    key: '_uiqsgdugqsdhis5678==',
    from: 'no-reply@heimdall.fr',
    to: 'admin@eimdall.fr'
  }
}

const mockSend = jest.fn()
  .mockResolvedValue()
  .mockName('send')

mail.createSender.mockReturnValue(mockSend)

const mockServer = {
  listen: jest.fn().mockName('listen')
}

createServer.mockReturnValue(mockServer)

const mockResponse = {
  end: jest.fn().mockName('end')
}

describe('lib/watcher', () => {
  afterEach(() => delete mockResponse.statusCode)

  it('should send log mail on "error-log" event', async () => {
    const logMsg = 'log message'
    readBody.mockResolvedValueOnce(logMsg)

    watch(env)

    const projectDirPattern = '^.+/' + process.env.npm_package_name

    expect(mail.createSender).toHaveBeenCalledWith({
      apiKey: env.mail.key,
      from: env.mail.from,
      templatesDir: expect.stringMatching(new RegExp(projectDirPattern + '/assets/mails$')),
      subjectsFile: expect.stringMatching(new RegExp(projectDirPattern + '/assets/mails/subjects.json$'))
    })

    expect(createServer).toHaveBeenCalledWith(expect.any(Function))
    expect(mockServer.listen).toHaveBeenCalledWith(env.port)

    const { calls: [[sendLog]] } = createServer.mock
    const mockRequest = { method: 'POST' }

    sendLog(mockRequest, mockResponse)

    // wait for readBody() and mail send to resolve
    await nextTick()

    expect(readBody).toHaveBeenCalledWith(mockRequest)

    expect(mockSend).toHaveBeenCalledWith({
      templateId: 'error',
      to: env.mail.to,

      params: {
        app: 'heimdall',
        log: logMsg
      }
    })

    expect(mockResponse.statusCode).not.toBeDefined()
    expect(mockResponse.end).toHaveBeenCalledWith('message sent successfully')
  })

  it('should reject http methods other than POST', () => {
    watch(env)

    const { calls: [[sendLog]] } = createServer.mock
    const mockRequest = { method: 'NOT_POST' }
    sendLog(mockRequest, mockResponse)

    expect(mockResponse.statusCode).toBe(404)
    expect(mockResponse.end).toHaveBeenCalledWith(mockRequest.method + ' method is not supported')
  })

  it('should handle errors', async () => {
    const error = new Error('Test error')
    readBody.mockRejectedValueOnce(error)

    watch(env)

    const { calls: [[sendLog]] } = createServer.mock
    sendLog({ method: 'POST' }, mockResponse)

    // wait for readBody() to reject
    await nextTick()

    expect(mockResponse.statusCode).toBe(500)
    expect(mockResponse.end).toHaveBeenCalledWith('error occured while sending log message:\n' + error.message)
  })
})
