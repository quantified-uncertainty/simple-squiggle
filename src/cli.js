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
  console.log(`=> ${result[0]}`);
  console.log(`   ( => ${result[1]} )`);
  console.log("");

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
