import { transformer } from "./index.js";

let printer = (_) => null;
let getSimpleSquiggleOutput = (string) => transformer(string, printer);
let result = getSimpleSquiggleOutput("(1 to 10)/(1 to 20)");
console.log(result);
