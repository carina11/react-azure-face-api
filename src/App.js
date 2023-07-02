import logo from './logo.svg';
import './App.css';
import {BrowserRouter, Route} from "react-router-dom";
import Home from "./components/Home"
import compareFaces from "./components/compareFaces"

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Route exact path="/" component={Home}/>
        <Route path="/compare" component={compareFaces}/>
      </BrowserRouter>
    </div>
  );
}

export default App;
