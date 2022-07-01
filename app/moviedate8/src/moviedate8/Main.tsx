import {
  BrowserRouter,
  Params,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import Follow from "./Follow";
import Lead from "./Lead";
import Stream from "./Stream";

function Main() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={"/stream/:toStream"}
          element={
            <Routed
              element={(params: Params) => (
                <Stream rawToStream={params.toStream!} />
              )}
            />
          }
        />
        <Route path={"/lead"} element={<Lead />} />
        <Route index element={<Follow />} />
      </Routes>
    </BrowserRouter>
  );
}

function Routed(props: { element: (params: Params) => JSX.Element }) {
  let params = useParams();
  return props.element(params);
}

export default Main;
