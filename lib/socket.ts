/* 
Based on https://github.com/AnanthVivekanand/net-websocket-polyfill

Wraps WebSocket in a NodeJS socket-like interface.
 */

import EventEmitter from 'https://deno.land/x/events/mod.ts';
import Buffer from 'https://deno.land/std@0.76.0/node/buffer.ts';

export class Socket extends EventEmitter {
  url: URL | undefined
  ws: WebSocket | undefined
  encoding: string | undefined

  constructor () {
    super()
  }
  
  connect (...args: any[]) {
    var connectListener
    
    if (typeof args[0] == 'string') {
      this.url = new URL(args[0])
      if (typeof args[1] == 'function') {
        connectListener = args[1]
      } 
    }
    else if (typeof args[0] == 'object') {
      this.url = new URL('ws://' + args[0].host)
      this.url.port = args[0].port
    }
    else if (typeof args[0] == 'number') {
      this.url = new URL('ws://localhost')
      this.url.port = String(args[0])
      if (typeof args[1] == 'string') {
        this.url.hostname = args[1]
        if (typeof args[2] == 'function') {
          connectListener = args[2]
        }
      }
    }
    
    if (connectListener) {
      this.on('connect', connectListener)
    }
    if (this.url) {
      console.log('Attempting to connect to', this.url.href)
      this.ws = new WebSocket(this.url.href)
      console.log('Connected')
      configureEvents(this)
      console.log('Done')
    }
    return this
  }
  
  write (data: any, encoding?: string, callback?: () => void) {
    console.log('Attempting write', data)
    if (typeof data == 'string') {
      this.ws?.send(data)
    } else {
      this.ws?.send(new Blob([data])) 
    }
    console.log('Finished write', data)
    
    if (typeof callback == 'function') {
      callback()
    }
  }
  
  setEncoding (encoding: string) {
    if (encoding == 'utf8') {
      this.encoding = encoding
    } else { 
      this.encoding = 'binary'
    }
  }
  
  get connecting() {
    return (this.ws?.readyState == WebSocket.CONNECTING)
  }
  
  destroy (exception = null) {
    console.log('Attempting destroy')
    if (this.ws) {
      this.ws.close(1000, 'destroy called')
      this.emit('error', exception)
    }
    console.log('Finished destroy')
    return this
  }
  
  get remotePort(): number | undefined {
    return this.url ? Number(this.url?.port) : undefined
  }
  
  get bufferSize(): number {
    return this.ws?.bufferedAmount || 0
  }
  
  get destroyed(): boolean {
    return this.ws?.readyState == WebSocket.CLOSED || false
  }
  
  address() {
    
  }
  
  get remoteAddress () {
    return '' // TODO
  }
}

function configureEvents (instance: Socket) {
  if (instance.ws) {
    instance.ws.onclose = (event: CloseEvent) => {
      console.log('onclose')
      if (event.code == 1006) {
        instance.emit('close', { hadError: true })
      } else {
        instance.emit('close', { hadError: false })
      }
    }
    instance.ws.onerror = (event: Event | ErrorEvent) => {
      console.log('onerror', event)
      instance.emit('error', ('message' in event) ? (event as ErrorEvent).message : '')
    }
    instance.ws.onmessage = (event: MessageEvent) => {
      console.log('onmessage')
      /* Data format depends on what proxy is used
      so we'll try to support as many as we can */
      
      if (instance.encoding == 'binary') {
        if (event.data instanceof Blob) {
          toBuffer(event.data, (err, buf) => { 
            if (err) throw err
            
            instance.emit('data', buf)
          })
        } else if (typeof event.data == 'string') {
          return Buffer.from(event.data)
        }
      } else if (instance.encoding == 'utf8') {
        if (event.data instanceof Blob) {
          const reader = new FileReader()
          reader.onload = () => {
            instance.emit('data', reader.result)
          }
          reader.readAsText(event.data)
        } else if (typeof event.data == 'string') {
          instance.emit('data', event.data) 
        }
      }
    }
    instance.ws.onopen = (event: Event) => {
      console.log('onopen')
      instance.emit('connect') /* Nothing else */
      instance.emit('ready')
    }
  }
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