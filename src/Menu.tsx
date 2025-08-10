import { Link } from "react-router-dom";
import { Breathe } from "./Breathe";
export const Menu = () => {
  return (
    <ul>
      <li>
        <Breathe />
        {/* <Link to="breathe">Breathe</Link> */}
      </li>
      <li>
        <Link to="glassmorphism">Glassmorphism</Link>
      </li>
      <li>
        <Link to="shader">Shader</Link>
      </li>
      <li>
        <Link to="shaders">Shaders</Link>
      </li>
      <li>
        <Link to="playground">Playground</Link>
      </li>
      <li>
        <Link to="hello">Hello</Link>
      </li>
      <li>
        <Link to="shader1">Shader 1 (WASM)</Link>
      </li>
      <li>
        <Link to="shader2">Shader 2 (WASM)</Link>
      </li>
    </ul>
  );
};
