export default function Player({ src }: { src: string }) {
  return (
    <div>
      <div style={{ width: "100vW", height: "100vH" }}>
        <video src={src} />
      </div>
    </div>
  );
}
