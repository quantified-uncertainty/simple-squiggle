import { transformer } from "./index.js";

let VERBOSE = false;
let print = (x) => {
  if (VERBOSE) {
    console.log(x);
  }
};

let testTransformer = (string) => {
  console.log(string);
  console.group();
  print("");
  let result = transformer(string, print);
  print("");
  console.groupEnd();
  console.log(`=> ${result}`);
  print("-".repeat(52));
  console.log("");
};

// Defs
let tests1 = [
  `lognormal(1,10) * lognormal(1,10) + lognormal(1,10)`,
  `lognormal(1,10) * lognormal(1,10) * lognormal(1,10)`,
  `1 to 10 * lognormal(1, 10)`,
  `lognormal(1, 10) * 1 to 20`,
  `1 to 20 * 100 to 1000`,
  `(lognormal(1,10) / lognormal(1,10)) + lognormal(1,10)`,
  `lognormal(1,10) * lognormal(1,10) / lognormal(1,10)`,
  `1 to 10 * lognormal(1, 10) / 1 to 10`,
  `lognormal(1, 10) * 1 to 20 / 1 to 20`,
  `1 to 20 * 100 to 1000 / 1 to 100`,
];
let runTests1 = false;
if (runTests1) {
  console.clear();
  tests.forEach((test) => testTransformer(test));
}

let tests2 = [
  `3 * lognormal(1,10)`,
  `lognormal(1,10) * 4`,
  `lognormal(1, 10) / 3`,
  `3 / lognormal(1, 10)`,
  `lognormal(1,10) * lognormal(1/10) / 3`,
  `lognormal(1, 10) / (1 to 3)`,
];

let runTests2 = false;
if (runTests2) {
  console.clear();
  tests2.forEach((test) => testTransformer(test));
}

let tests3 = [
  `(lognormal(1,10))`,
  `lognormal(1,10) * (lognormal(1, 10) * 3) / (4 * lognormal(1,10))`,
];
let runTests3 = false;
if (runTests3) {
  console.clear();
  tests3.forEach((test) => testTransformer(test));
}

let tests4 = [
  `(1 to 2) * 3 * lognormal(1,10) * (1/lognormal(1,10)) / (1 to 10)`,
  `lognormal(2.4451858789480823, 10.002219515733781) * lognormal(-1, 10) `,
];
let runTests4 = true;
if (runTests4) {
  console.clear();
  tests4.forEach((test) => testTransformer(test));
}
