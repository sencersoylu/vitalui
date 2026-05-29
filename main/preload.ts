import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
process.on('uncaughtException', function (err) {
  console.log(err);
})

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value)
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
  getServerIp(): string {
    return ipcRenderer.sendSync('get-server-ip')
  },
  store: {
    get(key: string): string | null {
      return ipcRenderer.sendSync('store:get', key)
    },
    set(key: string, value: string): void {
      ipcRenderer.sendSync('store:set', key, value)
    },
    remove(key: string): void {
      ipcRenderer.sendSync('store:remove', key)
    },
  },
}

contextBridge.exposeInMainWorld('ipc', handler)

export type IpcHandler = typeof handler
