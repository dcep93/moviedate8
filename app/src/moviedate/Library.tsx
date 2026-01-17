export type LibraryType = {
  [key: string]: string;
};

export default function Library({ library }: { library: LibraryType }) {
  return <div>library</div>;
}
