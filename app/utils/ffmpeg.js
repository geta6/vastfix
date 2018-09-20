// @flow
import ffmpeg from 'ffmpeg-binaries';
import { execFile } from 'child_process';

export default (args: string[]) =>
  new Promise(resolve => {
    execFile(ffmpeg, args, (e, stdout, stderr) => {
      resolve(stderr.trim());
    });
  });
