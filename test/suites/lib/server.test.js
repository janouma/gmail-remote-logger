/* eslint-env jest */

import { createServer } from 'http'
import { promisify } from 'util'
import mail from '../../../lib/mail_util_loader'
import serve from '../../../lib/server'
import { readBody } from '../../../utils/http'

jest.mock('http')
jest.mock('../../../lib/mail_util_loader', () => ({ createSender: jest.fn() }))
jest.mock('../../../utils/http')

const nextTick = promisify(setImmediate)

const env = {
  port: 4653,
  mail: {
    key: 'expected.mail.api.key',
    from: 'no-reply@heimdall.fr',
    to: 'admin@eimdall.fr'
  },
  allowOrigin: '*'
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

describe('lib/server', () => {
  afterEach(() => delete mockResponse.statusCode)

  it('should send log mail on "error-log" event', async () => {
    const logMsg = 'log message'
    readBody.mockResolvedValueOnce(logMsg)

    serve(env)

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

    const mockRequest = {
      method: 'POST',
      headers: { origin: 'https://localhost:3003' }
    }

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

  it('should send log mail when origin macthes allowOrigin', async () => {
    const allowOrigin = 'https://heimdallinsight.com'
    const logMsg = 'log message'
    readBody.mockResolvedValueOnce(logMsg)

    serve({
      ...env,
      allowOrigin
    })

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

    const mockRequest = {
      method: 'POST',
      headers: { origin: allowOrigin }
    }

    sendLog(mockRequest, mockResponse)

    // wait for readBody() and mail send to resolve
    await nextTick()

    expect(mockResponse.end).toHaveBeenCalledWith('message sent successfully')
  })

  it('should handle request.headers.Origin case', async () => {
    const allowOrigin = 'https://heimdallinsight.com'
    const logMsg = 'log message'
    readBody.mockResolvedValueOnce(logMsg)

    serve({
      ...env,
      allowOrigin
    })

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

    const mockRequest = {
      method: 'POST',
      headers: { Origin: allowOrigin }
    }

    sendLog(mockRequest, mockResponse)

    // wait for readBody() and mail send to resolve
    await nextTick()

    expect(mockResponse.end).toHaveBeenCalledWith('message sent successfully')
  })

  it('should reject http methods other than POST', () => {
    serve(env)

    const { calls: [[sendLog]] } = createServer.mock

    const mockRequest = {
      method: 'NOT_POST',
      headers: { origin: 'https://localhost:3003' }
    }

    sendLog(mockRequest, mockResponse)

    expect(mockResponse.statusCode).toBe(400)
    expect(mockResponse.end).toHaveBeenCalledWith(
      `Bad request:\nmethod: ${mockRequest.method}\norigin: ${mockRequest.headers.origin}\nallowOrigin: ${env.allowOrigin}`
    )
  })

  it('should reject requests from unkown origin', () => {
    serve(env)

    const { calls: [[sendLog]] } = createServer.mock

    const mockRequest = {
      method: 'POST',
      headers: {}
    }

    sendLog(mockRequest, mockResponse)

    expect(mockResponse.statusCode).toBe(400)
    expect(mockResponse.end).toHaveBeenCalledWith(
      `Bad request:\nmethod: ${mockRequest.method}\norigin: ${mockRequest.headers.origin}\nallowOrigin: ${env.allowOrigin}`
    )
  })

  it('should reject requests if allowOrigin is not set', () => {
    const allowOrigin = undefined

    serve({
      ...env,
      allowOrigin
    })

    const { calls: [[sendLog]] } = createServer.mock

    const mockRequest = {
      method: 'POST',
      headers: { origin: 'https://localhost:3003' }
    }

    sendLog(mockRequest, mockResponse)

    expect(mockResponse.statusCode).toBe(400)
    expect(mockResponse.end).toHaveBeenCalledWith(
      `Bad request:\nmethod: ${mockRequest.method}\norigin: ${mockRequest.headers.origin}\nallowOrigin: ${allowOrigin}`
    )
  })

  it('should reject requests if origin is not allowed', () => {
    const allowOrigin = 'https://heimdallinsight.com'

    serve({
      ...env,
      allowOrigin
    })

    const { calls: [[sendLog]] } = createServer.mock

    const mockRequest = {
      method: 'POST',
      headers: { origin: 'https://localhost:3003' }
    }

    sendLog(mockRequest, mockResponse)

    expect(mockResponse.statusCode).toBe(400)
    expect(mockResponse.end).toHaveBeenCalledWith(
      `Bad request:\nmethod: ${mockRequest.method}\norigin: ${mockRequest.headers.origin}\nallowOrigin: ${allowOrigin}`
    )
  })

  it('should handle errors', async () => {
    const error = new Error('Test error')
    readBody.mockRejectedValueOnce(error)

    serve(env)

    const { calls: [[sendLog]] } = createServer.mock

    sendLog({
      method: 'POST',
      headers: { origin: 'https://localhost:3003' }
    }, mockResponse)

    // wait for readBody() to reject
    await nextTick()

    expect(mockResponse.statusCode).toBe(500)
    expect(mockResponse.end).toHaveBeenCalledWith('error occured while sending log message:\n' + error.message)
  })

  it('should reject missing request body (log message)', async () => {
    serve(env)

    const { calls: [[sendLog]] } = createServer.mock

    const mockRequest = {
      method: 'POST',
      headers: { origin: 'https://localhost:3003' }
    }

    sendLog(mockRequest, mockResponse)

    // wait for readBody() to reject
    await nextTick()

    expect(mockResponse.statusCode).toBe(400)
    expect(mockResponse.end).toHaveBeenCalledWith('Bad request: body (log message) is empty')
  })
})
