export default async function load () {
  return (await import(process.env.npm_package_config_path)).default[process.env.NODE_ENV || 'production']
}
