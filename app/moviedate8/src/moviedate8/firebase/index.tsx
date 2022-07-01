// https://console.firebase.google.com/u/0/project/moviedate8/database/moviedate8-default-rtdb/data

import firebase from "./firebase";

export enum StateEnum {
  paused,
  playing,
}

export type WatcherType = {
  start: number;
  url: string;
  progress: number;
  timestamp: number;
  speed: number;
  state: StateEnum;
};

export type WatchersType = { [user_name: string]: WatcherType };

export type EverythingType = {
  leader: string;
  watchers?: WatchersType;
};

function writeLeader(leader: string) {
  return firebase._set("/leader", leader);
}

function writeWatcher(userName: string, watcher: WatcherType) {
  return firebase._set(`/watchers/${userName}`, watcher);
}

const ex = { writeLeader, writeWatcher };

export const FirebaseWrapper = firebase._FirebaseWrapper;

export default ex;
