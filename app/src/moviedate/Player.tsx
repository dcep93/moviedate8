import type { RefObject } from 'react';
import Chromecast from './Chromecast';

export default function Player({ videoRef, follower, subs }: {
  videoRef: RefObject<HTMLVideoElement | null>;
  follower: boolean;
  subs?: string;
}) {
  return <div className={follower ? 'player player--follower' : 'player'}>
    <video ref={videoRef} controls={!follower} playsInline preload="auto" x-webkit-airplay="allow">
      {subs && <track key={subs} kind="subtitles" src={subs} label="Subtitles" default />}
    </video>
    <Chromecast videoRef={videoRef} />
  </div>;
}
