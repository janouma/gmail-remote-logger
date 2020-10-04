export const readBody = request => new Promise((resolve, reject) => {
  const chunks = []

  request.on('data', chunk => chunks.push(chunk))
  request.on('end', () => resolve(chunks.join('')))
  request.on('error', error => reject(error))
})
