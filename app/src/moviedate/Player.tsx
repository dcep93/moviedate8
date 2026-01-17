export type LibraryValue = { src: string; subs?: string };

export type PlayerConfig = LibraryValue & {};

export default function Player(playerConfig: PlayerConfig) {
  return (
    <div>
      <div style={{ width: "100vW", height: "100vH" }}>
        <video
          src={playerConfig.src}
          controls
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );
}
