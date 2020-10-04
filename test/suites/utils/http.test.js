/* eslint-env jest */

import { readBody } from '../../../utils/http'

const mockRequest = {
  on: jest.fn().mockName('on')
}

describe('utils/http', () => {
  describe('#readBody', () => {
    let bodyPromise
    let receiveData
    let endStream
    let abortRead

    beforeEach(() => {
      bodyPromise = readBody(mockRequest)
      ;([/* data event */, receiveData] = mockRequest.on.mock.calls.find(([event]) => event === 'data'))
      ;([/* end event */, endStream] = mockRequest.on.mock.calls.find(([event]) => event === 'end'))
      ;([/* error event */, abortRead] = mockRequest.on.mock.calls.find(([event]) => event === 'error'))
    })

    it('should read request stream until it ends', async () => {
      const chunks = [
        'chunk one',
        'chunk two'
      ]

      chunks.forEach(chunck => receiveData(chunck))
      endStream()

      const body = await bodyPromise
      expect(body).toBe(chunks.join(''))
    })

    it('should reject on request stream error', () => {
      const error = new Error('Test error')
      abortRead(error)
      return expect(bodyPromise).rejects.toBe(error)
    })
  })
})
