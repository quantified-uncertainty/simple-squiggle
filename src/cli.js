import readline from "readline";
import { transformer } from "./index.js";

let VERBOSE = true;
let print = (x) => {
  if (VERBOSE) {
    console.log(x);
  }
};

let runTransformer = (string) => {
  // console.log(`Received: ${string}`);
  console.group();
  print("");
  let result = transformer(string, print);
  print("");
  console.groupEnd();
  console.log(`=> ${result}`);
  print("-".repeat(52));
  console.log("");
};

let cliWrapper = async (message, callback) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question(message, async (answer) => {
    rl.close();
    await callback(answer);
  });
};

cliWrapper("Model: ", runTransformer);
