export type Data = {
  [key: string]: string;
};

export default function Library({
  data: library,
  setSrc,
}: {
  data: Data;
  setSrc: (src: string) => void;
}) {
  return (
    <div>
      <h1>Library</h1>
      <ul>
        {library &&
          Object.entries(library).map(([key, value]) => (
            <li key={key}>
              <button onClick={() => setSrc(value)}>{key}</button>
            </li>
          ))}
      </ul>
    </div>
  );
}
