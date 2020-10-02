import objectUtils from '@heimdall/utils/object'

const { merge } = objectUtils

const common = {
  apis: {
    pusher: {
      key: 'PUSHER_DEV_KEY',
      channel: 'heimdall'
    },
    mail: {
      key: 'MAILING_SERVICE_API_KEY',
      from: 'no-reply@heimdallinsight.com',
      to: 'admin@eimdallinsight.com'
    }
  },

  logLevel: 'info'
}

export const development = merge({}, common, {
  logLevel: 'debug'
})

export default {
  development,
  test: development,
  production: common
}
