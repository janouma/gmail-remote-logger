import logLevel from 'loglevel'
import loadEnv from './env.js'
import watch from './lib/watcher.js'

async function start () {
  const env = await loadEnv()

  logLevel.setLevel(env.logLevel)

  const log = logLevel.getLogger('index')

  if (log.getLevel() === log.levels.TRACE) {
    for (const key in env) {
      console.debug(key, ':', env[key])
    }
  }

  watch(env)
}

start()
