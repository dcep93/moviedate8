import {
  BrowserRouter,
  Params,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import Home from "./Home";
import Link from "./Link";
import Stream from "./Stream";
import css from "./index.module.css";

function Main() {
  return (
    <div className={css.main}>
      <BrowserRouter>
        <Routes>
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
          <Route path={"/link"} element={<Link />} />
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
