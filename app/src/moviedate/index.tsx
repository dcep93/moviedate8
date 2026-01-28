import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AirplayDirect from "./AirplayDirect";
import Root from "./Root";
import Static from "./Static";

export default function Moviedate() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/s" element={<Static />} />
        <Route path="/airplay" element={<AirplayDirect />} />
      </Routes>
    </Router>
  );
}
