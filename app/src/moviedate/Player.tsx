export default function Player({ src }: { src: string }) {
  return (
    <div style={{ width: "100vW", height: "100vH" }}>
      <video src={src} />
    </div>
  );
}
