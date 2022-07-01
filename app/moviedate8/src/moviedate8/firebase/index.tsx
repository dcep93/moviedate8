// https://console.firebase.google.com/u/0/project/moviedate8/database/moviedate8-default-rtdb/data

import firebase from "./firebase";

export type LeadType = {};

export type FollowType = {};

export type AllFollowType = { [user_name: string]: FollowType };

export type EverythingType = {
  lead?: LeadType;
  follow?: AllFollowType;
};

function writeLead(lead: LeadType) {
  return firebase._set("/lead", lead);
}

function writeFollow(key: string, follow: FollowType) {
  return firebase._set(`/follow/${key}`, follow);
}

const ex = { writeLead, writeFollow };

export const FirebaseWrapper = firebase._FirebaseWrapper;

export default ex;
