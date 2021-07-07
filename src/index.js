import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import firebase from "firebase";

let initialised = false;

export function initFirebase() {
  if (initialised) {
    return;
  }
  const firebaseConfig = {
    apiKey: "AIzaSyDd-g1pxYDd5wiI-8aRLKO7k0hpIA2ogO0",
    authDomain: "planning-poker-27ef5.firebaseapp.com",
    databaseURL: "https://planning-poker-27ef5.firebaseio.com",
    projectId: "planning-poker-27ef5",
    storageBucket: "planning-poker-27ef5.appspot.com",
    messagingSenderId: "359210422354",
    appId: "1:359210422354:web:32c9e1671ff01dddb68f8b",
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  initialised = true;
}

initFirebase();

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
