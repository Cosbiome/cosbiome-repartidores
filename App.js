import React from "react";
import { NativeRouter, Switch, Route } from "react-router-native";
import Home from "./pages/Home.js";
import ListRepartidor from "./pages/ListRepartidor.js";

const App = () => {
  return (
    <NativeRouter>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/listRepartidor" component={ListRepartidor} />
      </Switch>
    </NativeRouter>
  );
};

export default App;
