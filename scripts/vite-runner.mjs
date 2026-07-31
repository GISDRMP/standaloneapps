import { EventEmitter } from 'node:events';
import { createRequire, syncBuiltinESMExports } from 'node:module';
import { PassThrough } from 'node:stream';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const childProcess = require('node:child_process');
const originalExec = childProcess.exec;
let stubInstalled = false;

export const installWindowsNetUseStub = () => {
  if (stubInstalled) return;

  childProcess.exec = (command, options, callback) => {
    const normalizedCommand = String(command).trim().toLowerCase();

    if (normalizedCommand === 'net use') {
      const done = typeof options === 'function' ? options : callback;
      const fakeProcess = new EventEmitter();
      fakeProcess.stdin = new PassThrough();
      fakeProcess.stdout = new PassThrough();
      fakeProcess.stderr = new PassThrough();
      fakeProcess.kill = () => true;

      queueMicrotask(() => {
        done?.(null, '', '');
        fakeProcess.emit('close', 0);
        fakeProcess.emit('exit', 0);
      });

      return fakeProcess;
    }

    return originalExec(command, options, callback);
  };

  syncBuiltinESMExports();
  stubInstalled = true;
};

export const runVite = async (mode = 'dev') => {
  installWindowsNetUseStub();

  const vite = await import('vite');

  if (mode === 'build') {
    await vite.build();
  } else if (mode === 'preview') {
    const server = await vite.preview({
      preview: {
        host: '127.0.0.1',
        port: 4173,
      },
    });
    server.printUrls();
  } else {
    const server = await vite.createServer({
      server: {
        host: '127.0.0.1',
        port: 5173,
      },
    });
    await server.listen();
    server.printUrls();
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runVite(process.argv[2] ?? 'dev');
}
