// https://console.firebase.google.com/u/0/project/moviedate8/database/moviedate8-default-rtdb/data

import firebase from "./firebase";

export type LeadType = {};

export type FollowType = {};

export type EverythingType = {
  lead?: LeadType;
  follow?: { [k: string]: FollowType };
};

function write_lead(lead: LeadType) {
  return firebase._set("/lead", lead);
}

const ex = { write_lead };

export const FirebaseWrapper = firebase._FirebaseWrapper;

export default ex;
