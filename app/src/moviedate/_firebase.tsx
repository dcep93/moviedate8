import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

export const databaseURL = 'https://movied8-default-rtdb.firebaseio.com';
export const rootPath = (import.meta.env.VITE_DATABASE_ROOT || '/root').replace(/\/$/, '');
export const database = getDatabase(getApps().length ? getApp() : initializeApp({ databaseURL }));
