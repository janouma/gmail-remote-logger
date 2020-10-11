import logLevel from 'loglevel'
import serve from './lib/server.js'

const {
  PORT,
  MAIL_API_KEY,
  MAIL_FROM,
  MAIL_TO,
  NODE_ENV,
  ALLOW_ORIGIN,
  LOG_LEVEL
} = process.env

const env = {
  port: PORT,
  mail: {
    key: MAIL_API_KEY,
    from: MAIL_FROM,
    to: MAIL_TO
  },
  allowOrigin: NODE_ENV === 'development' ? '*' : ALLOW_ORIGIN
}

logLevel.setLevel(LOG_LEVEL)

if (NODE_ENV === 'development') {
  for (const key in env) {
    console.debug(key, ':', env[key])
  }
}

serve(env)
