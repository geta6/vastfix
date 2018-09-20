// @flow
import path from 'path';
import ffmpeg from 'ffmpeg-binaries';
import { execFile } from 'child_process';

export default (args: string[]) =>
  new Promise(resolve => {
    const execPath =
      process.env.NODE_ENV === 'production'
        ? path.join(
            process.resourcesPath,
            'app.asar.unpacked',
            'node_modules',
            'ffmpeg-binaries',
            'bin',
            `ffmpeg${process.platform === 'win32' ? '.exe' : ''}`
          )
        : ffmpeg;
    execFile(execPath, args, (e, stdout = '', stderr = '') => {
      console.info(execPath, e, stdout, stderr);
      resolve(stderr.trim());
    });
  });
