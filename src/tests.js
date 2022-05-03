import { transformer } from "./index.js";

let VERBOSE = true;
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
  console.log(`=> ${result.squiggleString}`);
  print("");
  print(result);
  print("-".repeat(52));
  console.log("");
};

// Define tests
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

let tests2 = [
  `3 * lognormal(1,10)`,
  `lognormal(1,10) * 4`,
  `lognormal(1, 10) / 3`,
  `3 / lognormal(1, 10)`,
  `lognormal(1,10) * lognormal(1/10) / 3`,
  `lognormal(1, 10) / (1 to 3)`,
];

let tests3 = [
  `(lognormal(1,10))`,
  `lognormal(1,10) * (lognormal(1, 10) * 3) / (4 * lognormal(1,10))`,
];

let tests4 = [
  `(1 to 2) * 3 * lognormal(1,10) * (1/lognormal(1,10)) / (1 to 10)`,
  `lognormal(2.4451858789480823, 10.002219515733781) * lognormal(-1, 10) `,
];

// Run tests
console.log("\n".repeat(10));
console.clear();
let runTests1 = true;
if (runTests1) {
  tests1.forEach((test) => testTransformer(test));
}

let runTests2 = true;
if (runTests2) {
  tests2.forEach((test) => testTransformer(test));
}

let runTests3 = true;
if (runTests3) {
  tests3.forEach((test) => testTransformer(test));
}

let runTests4 = true;
if (runTests4) {
  tests4.forEach((test) => testTransformer(test));
}
