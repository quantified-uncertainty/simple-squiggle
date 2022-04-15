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
  let andTwoArgsAreConstant =
    andHasTwoArgs &&
    arg.args
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
    // Multiplication
    if (node.type == "OperatorNode" && node.op == "*") {
      let hasTwoArgs = node.args && node.args.length == 2;
      if (hasTwoArgs) {
        console.log(JSON.stringify(node.args, null, 4));
        // Multiplication of two lognormals
        let areArgsLognormal = node.args
          .map((arg) => isArgLognormal(arg))
          .reduce((a, b) => a && b, true);

        let isFirstArgLognormal = isArgLognormal(node.args[0]);
        let isSecondArgNumber = isConstantNode(node.args[1]);
        let isLognormalTimesNumber = isFirstArgLognormal * isSecondArgNumber;

        let isFirstArgNumber = isConstantNode(node.args[0]);
        let isSecondArgLognormal = isArgLognormal(node.args[1]);
        let isNumberTimesLognormal = isFirstArgNumber * isSecondArgLognormal;

        if (areArgsLognormal) {
          // lognormal times lognormal
          let factors = node.args.map((arg) => getFactors(arg));
          let mean1 = factors[0][0];
          let std1 = factors[0][1];
          let mean2 = factors[1][0];
          let std2 = factors[1][1];

          let newMean = mean1 + mean2;
          let newStd = Math.sqrt(std1 ** 2 + std2 ** 2);
          return createLogarithmNode(newMean, newStd);
        } else if (isLognormalTimesNumber) {
          // lognormal times number
          let lognormalFactors = getFactors(node.args[0]);
          let mean = lognormalFactors[0];
          let std = lognormalFactors[1];
          let multiplier = node.args[1].value;
          let logMultiplier = Math.log(multiplier);
          let newMean = mean + logMultiplier;
          return createLogarithmNode(newMean, std);
        } else if (isNumberTimesLognormal) {
          // number times lognormal
          let lognormalFactors = getFactors(node.args[1]);
          let mean = lognormalFactors[0];
          let std = lognormalFactors[1];
          let multiplier = node.args[0].value;
          let logMultiplier = Math.log(multiplier);
          let newMean = mean + logMultiplier;
          return createLogarithmNode(newMean, std);
        }
      }
    } else if (node.type == "OperatorNode" && node.op == "/") {
      let hasTwoArgs = node.args && node.args.length == 2;
      if (hasTwoArgs) {
        let areArgsLognormal = node.args
          .map((arg) => isArgLognormal(arg))
          .reduce((a, b) => a && b, true);

        let isFirstArgLognormal = isArgLognormal(node.args[0]);
        let isSecondArgNumber = isConstantNode(node.args[1]);
        let isLognormalDividedByNumber =
          isFirstArgLognormal * isSecondArgNumber;

        let isFirstArgNumber = isConstantNode(node.args[0]);
        let isSecondArgLognormal = isArgLognormal(node.args[1]);
        let isNumberDividedByLognormal =
          isFirstArgNumber * isSecondArgLognormal;

        if (areArgsLognormal) {
          let factors = node.args.map((arg) => getFactors(arg));
          let mean1 = factors[0][0];
          let std1 = factors[0][1];
          let mean2 = factors[1][0];
          let std2 = factors[1][1];

          let newMean = mean1 - mean2;
          let newStd = Math.sqrt(std1 ** 2 + std2 ** 2);
          return createLogarithmNode(newMean, newStd);
          return new math.SymbolNode("xx");
        } else if (isLognormalDividedByNumber) {
          let lognormalFactors = getFactors(node.args[0]);
          let mean = lognormalFactors[0];
          let std = lognormalFactors[1];
          let multiplier = node.args[1].value;
          let logMultiplier = Math.log(multiplier);
          let newMean = mean - logMultiplier;
          return createLogarithmNode(newMean, std);
        } else if (isNumberDividedByLognormal) {
          let lognormalFactors = getFactors(node.args[1]);
          let mean = lognormalFactors[0];
          let std = lognormalFactors[1];
          let multiplier = node.args[0].value;
          let logMultiplier = Math.log(multiplier);
          let newMean = -mean + logMultiplier;
          return createLogarithmNode(newMean, std);
        }
      }
    }
    if (node.type == "ParenthesisNode") {
      if (
        !!node.content &&
        !!node.content.fn &&
        node.content.fn.name == "lognormal"
      ) {
        return node.content;
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
