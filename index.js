import { create, all } from "mathjs";
const math = create(all);

// Helper functions
let printNode = (x) => console.log(JSON.stringify(x, null, 4));

let isNumber = (x) => typeof x === "number" && isFinite(x);

let isConstantNode = (arg) => {
  return !!arg.value && isNumber(arg.value);
};
let isArgLognormal = (arg) => {
  let isFn = typeof arg.fn != "undefined";
  let andNameIsLognormal = isFn && arg.fn.name == "lognormal";
  let andHasArgs = andNameIsLognormal && !!arg.args;
  let andHasTwoArgs = andHasArgs && arg.args.length == 2;
  let andTwoArgsAreConstant = arg.args
    .map(
      (innerArg) => isConstantNode(innerArg)
      // innerArg
    )
    .reduce((a, b) => a && b, true);
  return andTwoArgsAreConstant;
};

let getFactors = (node) => {
  return node.args.map((arg) => arg.value);
};

let createLogarithmNode = (mu, sigma) => {
  let node1 = new math.ConstantNode(mu);
  let node2 = new math.ConstantNode(sigma);
  let node3 = new math.FunctionNode("lognormal", [node1, node2]);
  return node3;
};

// Main function
let transformerInner = (string) => {
  let nodes = math.parse(string);
  let transformed = nodes.transform(function (node, path, parent) {
    if (node.type == "OperatorNode" && node.op == "*") {
      let hasArgs = node.args && node.args.length == 2;
      if (hasArgs) {
        let areArgsLognormal = node.args
          .map((arg) => isArgLognormal(arg))
          .reduce((a, b) => a && b, true);
        if (areArgsLognormal) {
          let factors = node.args.map((arg) => getFactors(arg));
          let mean1 = factors[0][0];
          let std1 = factors[0][1];
          let mean2 = factors[1][0];
          let std2 = factors[1][1];

          let newMean = mean1 + mean2;
          let newStd = Math.sqrt(std1 ** 2 + std2 ** 2);
          return createLogarithmNode(newMean, newStd);
          return new math.SymbolNode("xx");
        } else {
          return node;
        }
      } else {
        return node;
      }
    } else if (node.type == "OperatorNode" && node.op == "/") {
      let hasArgs = node.args && node.args.length == 2;
      if (hasArgs) {
        let areArgsLognormal = node.args
          .map((arg) => isArgLognormal(arg))
          .reduce((a, b) => a && b, true);
        if (areArgsLognormal) {
          let factors = node.args.map((arg) => getFactors(arg));
          let mean1 = factors[0][0];
          let std1 = factors[0][1];
          let mean2 = factors[1][0];
          let std2 = factors[1][1];

          let newMean = mean1 + mean2;
          let newStd = Math.sqrt(std1 ** 2 + std2 ** 2);
          return createLogarithmNode(newMean, newStd);
          return new math.SymbolNode("xx");
        }
      }
    }
    return node;
  });

  return transformed.toString();
};

let from90PercentCI = (low, high) => {
  let normal95confidencePoint = 1.6448536269514722;
  let logLow = Math.log(low);
  let logHigh = Math.log(high);
  let mu = (logLow + logHigh) / 2;
  let sigma = (logHigh - logLow) / (2.0 * normal95confidencePoint);
  return [mu, sigma];
};

let simplePreprocessor = (string) => {
  // left for documentation purposes only
  function replacer(match, p1, p2) {
    console.log(match);
    // p1 is nondigits, p2 digits, and p3 non-alphanumericsa
    console.log([p1, p2]);
    let result = from90PercentCI(p1, p2);
    return `lognormal(${result[0]}, ${result[1]})`;
  }
  let newString = string.replace(/(\d+) to (\d+)/g, replacer);
  console.log(newString);
  return newString; // abc - 12345 - #$*%
};

// simplePreprocessor("1 to 10 + 1 to 20");

let preprocessor = (string) => {
  // work in progress, currently not working
  let regex = /([\d]+\.?[\d]*|\.[\d]+) to ([\d]+\.?[\d]*|\.[\d]+)/g;
  function replacer(match, p1, p2) {
    let result = from90PercentCI(p1, p2);
    return `lognormal(${result[0]}, ${result[1]})`;
  }
  let newString = string.replace(regex, replacer);
  if (newString != string) console.log(`\tPreprocessing: ${newString}`);
  return newString; // abc - 12345 - #$*%
};
// preprocessor("1.2 to 10.5 * 1.1 to 20 * 1 to 2.5 * 1 to 5");

let transformer = (string) => {
  string = preprocessor(string);
  let stringNew = transformerInner(string);
  while (stringNew != string) {
    console.log(`\tNew transformation: ${stringNew}`);
    string = stringNew;
    stringNew = transformerInner(string);
  }
  return stringNew;
};

let testTransformer = (string) => {
  console.log(`New test: ${string}`);
  console.group();
  let result = transformer(string);
  console.groupEnd();
  console.log(`Result: ${result}`);
  console.log("");
};

// Defs
let tests = [
  `lognormal(1,10) * lognormal(1,10) + lognormal(1,10)`,
  `lognormal(1,10) * lognormal(1,10) * lognormal(1,10)`,
  `1 to 10 * lognormal(1, 10)`,
  `lognormal(1, 10) * 1 to 20`,
  `1 to 20 * 100 to 1000`,
];
console.clear();
tests.forEach((test) => testTransformer(test));
