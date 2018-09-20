// @flow
import get from 'lodash/get';
import result from 'lodash/result';
import React, { Component, DragEvent } from 'react';
import { remote } from 'electron';
import ffmpeg from '../utils/ffmpeg';
import routes from '../constants/routes.json';
import styles from './Home.css';

type Props = {};
type State = {
  analyzing: boolean,
  analyzed: boolean,
  converting: boolean,
  lufs: ?number,
  path: string
};

export default class Home extends Component<Props, State> {
  props: Props;

  state = {
    analyzing: false,
    analyzed: false,
    converting: false,
    lufs: null,
    path: ''
  };

  handlePrevent = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const item: DataTransferItem = get(event, ['dataTransfer', 'items', 0]);
    if (item.type !== 'video/mp4') {
      alert('mp4をドロップしてください');
      return;
    }
    console.log(result(item, ['getAsFile']));
    const { path }: { path: string } = result(item, ['getAsFile']);
    this.setState({ path }, () => {
      this.handleAnalyze();
    });
  };

  handleConvert = () => {
    this.setState({ converting: true }, async () => {
      try {
        const { path } = this.state;
        const output = path.replace(/\.mp4$/, `.${Date.now()}.mp4`);
        const res = await ffmpeg(['-i', path, '-c:v', 'copy', '-af', 'loudnorm=I=-24:LRA=1', '-ar', '48000', output]);
        this.setState({ path: output }, () => {
          this.handleAnalyze();
        });
      } finally {
        this.setState({ converting: false });
      }
    });
  };

  handleAnalyze = () => {
    this.setState({ analyzed: false, analyzing: true }, async () => {
      const { path } = this.state;
      try {
        const res = await ffmpeg(['-nostats', '-i', path, '-filter_complex', 'ebur128', '-f', 'null', '-']);
        const lufs = parseFloat(
          res
            .split('\n')
            .reverse()
            .find(line => /^\s+I:[-0-9.\s]+LUFS/.test(line))
            .replace(/^\s+I:([-0-9.\s]+)LUFS/, '$1')
            .trim()
        );
        this.setState({ analyzed: true, lufs, path });
      } finally {
        this.setState({ analyzing: false });
      }
    });
  };

  renderMessage = () => {
    const { analyzing, analyzed, converting } = this.state;
    if (converting) {
      return <h2>変換中</h2>;
    }
    if (analyzed) {
      return null;
    }
    if (analyzing) {
      return <h2>解析中</h2>;
    }
    return <h2>ビデオをドロップする</h2>;
  };

  renderAnalyzed = () => {
    const { lufs, path, analyzed, converting } = this.state;
    if (!analyzed || converting) {
      return null;
    }
    return (
      <ul>
        <li>
          <div className={styles.key}>ファイル</div>
          <div className={styles.val}>{path}</div>
          <div className={styles.desc}>元ファイルは削除しないでください</div>
        </li>
        <li>
          <div className={styles.key}>ラウドネス(LUFS)</div>
          <div className={styles.val}>{lufs}</div>
          <div className={styles.desc}>LUFSの基準値は-23です、大きいと煩くて小さいと静かです</div>
        </li>
        <li>
          <button type="button" onClick={this.handleConvert}>
            変換を開始
          </button>
        </li>
      </ul>
    );
  };

  render = () => (
    <div
      className={styles.container}
      onDragEnter={this.handlePrevent}
      onDragOver={this.handlePrevent}
      onDrop={this.handleDrop}
    >
      {this.renderMessage()}
      {this.renderAnalyzed()}
    </div>
  );
}
