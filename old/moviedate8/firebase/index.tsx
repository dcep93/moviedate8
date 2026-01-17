// https://console.firebase.google.com/u/0/project/moviedate8/database/moviedate8-default-rtdb/data

import firebase from "./firebase";

export enum StateEnum {
  paused,
  playing,
}

export type WatcherType = {
  userName: string;
  start: number;
  url: string;
  progress: number;
  timestamp: number;
  speed: number;
  state: StateEnum;
};

export type WatchersType = { [userName: string]: WatcherType };

export type VideoType = { videoName: string; url?: string };

export type LibraryType = {
  [folderName: string]: { [key: string]: VideoType };
};

export type EverythingType = {
  leader?: string;
  watchers?: WatchersType;
  library?: LibraryType;
};

function writeLeader(leader: string) {
  return firebase._set("/leader", leader);
}

function writeWatcher(userName: string, watcher: WatcherType) {
  return firebase._set(`/watchers/${userName}`, watcher);
}

function appendToFolder(folder: string, url: string) {
  return firebase._push(`/library/${folder}`, {
    videoName: url.split("/").reverse()[0].split("?")[0],
    url,
  });
}

const ex = {
  writeLeader,
  writeWatcher,
  appendToFolder,
};

declare global {
  interface Window {
    ex: any;
  }
}
window.ex = ex;

export const FirebaseWrapper = firebase._FirebaseWrapper;

export default ex;
