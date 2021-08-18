import Duplex from 'https://deno.land/std@0.105.0/node/_stream/duplex.ts'
import Buffer from 'https://deno.land/std@0.76.0/node/buffer.ts';

export async function createWsStream (url: string) {
  const ws = new WebSocket(url)
  await new Promise(r => {ws.onopen = r})
  
  const stream = new Duplex({
    write (chunk, encoding, next) {
      ws.send(chunk)
      next()
    },
    read (size) {},
    destroy (err, cb) {
      ws.close(1000, 'destroy called')
      cb(err)
    }
  })
  ws.onmessage = e => {
    if (e.data instanceof Blob) {
      toBuffer(e.data, (err, buf) => { 
        if (err) throw err
        stream.push(buf)
      })
    } else if (typeof e.data === 'string') {
      stream.push(Buffer.from(e.data))
    }
  }
  return stream
}


// https://github.com/feross/blob-to-buffer
function toBuffer (blob: Blob, cb: (error: null, buf: Buffer) => void) {
  if (typeof Blob === 'undefined' || !(blob instanceof Blob)) {
    throw new Error('first argument must be a Blob')
  }
  if (typeof cb !== 'function') {
    throw new Error('second argument must be a function')
  }

  const reader = new FileReader()

  function onLoadEnd () {
    reader.removeEventListener('loadend', onLoadEnd, false)
    if (reader.result) {
      if (reader.result instanceof ArrayBuffer) {
        cb(null, Buffer.from(reader.result))
      } else if (typeof reader.result === 'string') {
        cb(null, Buffer.from(reader.result))
      } else {
        cb(null, Buffer.from(''))
      }
    } else {
      cb(null, Buffer.from(''))
    }
  }

  reader.addEventListener('loadend', onLoadEnd, false)
  reader.readAsArrayBuffer(blob)
}