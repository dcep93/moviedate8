export type PlayerConfig = { src: string };

export default function Player({ src }: PlayerConfig) {
  return (
    <div>
      <div style={{ width: "100vW", height: "100vH" }}>
        <video
          src={src}
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
