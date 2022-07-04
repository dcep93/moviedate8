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
  [folderName: string]: VideoType[];
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

function writeLibrary(folderName: string, videos: VideoType[]) {
  return firebase._set(`/library/${folderName}`, videos);
}

function getFolderFromSeedr() {
  function f() {
    Promise.all(
      Array.from(document.getElementsByClassName("file")).map((el) =>
        fetch(
          `https://www.seedr.cc/download/file/${el.getAttribute("data-id")}/url`
        )
          .then((resp) => resp.json())
          .then((j) => ({ videoName: j.name, url: j.url }))
      )
    )
      .then((videos) => ({
        videos,
        folderName: encodeURIComponent(document.title),
      }))
      .then((obj) => JSON.stringify(obj))
      .then((json) => `ex.writeLibraryFromJSON(${json})`)
      .then(console.log);
  }
  console.log(`(${f})()`);
}

function writeLibraryFromJSON(j: string) {
  const parts = JSON.parse(j);
  return writeLibrary(parts.folderName, parts.videos);
}

const ex = {
  writeLibraryFromJSON,
  getFolderFromSeedr,
  writeLeader,
  writeWatcher,
};

declare global {
  interface Window {
    ex: any;
  }
}
window.ex = ex;

export const FirebaseWrapper = firebase._FirebaseWrapper;

export default ex;
