import {
  BrowserRouter,
  Params,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import Home from "./Home";
import css from "./index.module.css";
import Stream from "./Stream";

function Main() {
  return (
    <div className={css.main}>
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
          <Route path={"/lead"} element={<Home lead={true} />} />
          <Route index element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

function Routed(props: { element: (params: Params) => JSX.Element }) {
  let params = useParams();
  return props.element(params);
}

export default Main;
