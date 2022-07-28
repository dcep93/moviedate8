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
            path={"/stream/:stream"}
            element={
              <Routed
                elementF={(params: Params) => (
                  <Stream rawToStream={params.stream!} />
                )}
              />
            }
          />
          <Route path={"/stream"} element={<Stream />} />
          <Route path={"/follow"} element={<Home follow={null} />} />
          <Route
            path={"/follow/:follow"}
            element={
              <Routed
                elementF={(params: Params) => <Home follow={params.follow} />}
              />
            }
          />
          <Route path={"/lead"} element={<Home lead />} />
          <Route index element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

function Routed(props: { elementF: (params: Params) => JSX.Element }) {
  let params = useParams();
  return props.elementF(params);
}

export default Main;
