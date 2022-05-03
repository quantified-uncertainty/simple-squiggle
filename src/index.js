import { create, all } from "mathjs";
const math = create(all);

// Helper functions
let VERBOSE = true;
let print = (x) => {
  if (VERBOSE) {
    console.log(x);
  }
};
let printNode = (x) => print(JSON.stringify(x, null, 4));

let isNumber = (x) => typeof x === "number" && isFinite(x);

let isConstantNode = (arg) => {
  return isNumber(arg.value);
};

let isNegativeNumberNode = (arg) => {
  return (
    arg.op == "-" && arg.fn == "unaryMinus" && arg.args && arg.args.length == 1
  );
};
let isArgLognormal = (arg) => {
  let isFn = typeof arg.fn != "undefined";
  let andNameIsLognormal = isFn && arg.fn.name == "lognormal";
  let andHasArgs = andNameIsLognormal && !!arg.args;
  let andHasTwoArgs = andHasArgs && arg.args.length == 2;
  let andTwoArgsAreCorrectType =
    andHasTwoArgs &&
    arg.args
      .map(
        (innerArg) => {
          let isConstant = isConstantNode(innerArg);
          let isNegative = isNegativeNumberNode(innerArg);
          return isConstant || isNegative;
        }
        // innerArg
      )
      .reduce((a, b) => a && b, true);
  return andTwoArgsAreCorrectType;
};

let getFactors = (node) => {
  return node.args.map((arg) => {
    if (isConstantNode(arg)) {
      return arg.value;
    } else if (isNegativeNumberNode(arg)) {
      return -arg.args[0].value;
    }
  });
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

  return transformed;
};

const normal95confidencePoint = 1.6448536269514722;

let from90PercentCI = (low, high) => {
  let logLow = Math.log(low);
  let logHigh = Math.log(high);
  let mu = (logLow + logHigh) / 2;
  let sigma = (logHigh - logLow) / (2.0 * normal95confidencePoint);
  return [mu, sigma];
};

let to90PercentCI = (mu, sigma) => {
  let logHigh = mu + normal95confidencePoint * sigma;
  let logLow = mu - normal95confidencePoint * sigma;
  let high = Math.exp(logHigh);
  let low = Math.exp(logLow);
  return [low, high];
};

let simplePreprocessor = (string) => {
  // left for documentation purposes only
  function replacer(match, p1, p2) {
    print(match);
    // p1 is nondigits, p2 digits, and p3 non-alphanumericsa
    print([p1, p2]);
    let result = from90PercentCI(p1, p2);
    return `lognormal(${result[0]}, ${result[1]})`;
  }
  let newString = string.replace(/(\d+) to (\d+)/g, replacer);
  print(newString);
  return newString; // abc - 12345 - #$*%
};

// simplePreprocessor("1 to 10 + 1 to 20");

let toLognormalParameters = (node) => {
  if (isArgLognormal(node)) {
    let factors = getFactors(node);
    // print(node);
    // print(factors);
    return [factors[0], factors[1]];
  } else {
    return null;
  }
};

let customToStringHandlerTwoDecimals = (node, options) => {
  if (node.type == "ConstantNode") {
    return node.value.toFixed(2);
  }
};

let preprocessor = (string, print = console.log) => {
  // work in progress, currently not working
  let regex = /([\d]+\.?[\d]*|\.[\d]+) to ([\d]+\.?[\d]*|\.[\d]+)/g;
  function replacer(match, p1, p2) {
    let result = from90PercentCI(p1, p2);
    return `lognormal(${result[0]}, ${result[1]})`;
  }
  let newString = string.replace(regex, replacer);
  if (newString != string)
    print(
      `\t= ${math
        .parse(newString)
        .toString({ handler: customToStringHandlerTwoDecimals })}`
    );
  return newString; // abc - 12345 - #$*%
};
// preprocessor("1.2 to 10.5 * 1.1 to 20 * 1 to 2.5 * 1 to 5");

let customToStringHandlerToGuesstimateSyntax = (node, options) => {
  if (isArgLognormal(node)) {
    let factors = getFactors(node);
    // print(node);
    // print(factors);
    let ninetyPercentCI = to90PercentCI(factors[0], factors[1]);
    return `~${ninetyPercentCI[0]} to ~${ninetyPercentCI[1]}`;
  }
};

let toPrecision2 = (f) => f.toPrecision(2);
let numToString = (x) =>
  x < 10
    ? toPrecision2(x).toLocaleString()
    : BigInt(Math.round(toPrecision2(x))).toString();

let toShortGuesstimateString = (node) => {
  if (isArgLognormal(node)) {
    let factors = getFactors(node);
    // print(node);
    // print(factors);
    let ninetyPercentCI = to90PercentCI(factors[0], factors[1]);
    return `${numToString(ninetyPercentCI[0])} to ${numToString(
      ninetyPercentCI[1]
    )}`;
  } else {
    return null;
  }
};

let to90CIArray = (node) => {
  if (isArgLognormal(node)) {
    let factors = getFactors(node);
    // print(node);
    // print(factors);
    let ninetyPercentCI = to90PercentCI(factors[0], factors[1]);
    return [ninetyPercentCI[0], ninetyPercentCI[1]];
  } else {
    return null;
  }
};

export function transformer(string, print = console.log) {
  string = preprocessor(string, print);
  let transformerOutput = transformerInner(string);
  let stringNew = transformerOutput.toString();
  while (stringNew != string) {
    print(
      `\t-> ${transformerOutput.toString({
        handler: customToStringHandlerTwoDecimals,
      })}`
    );
    string = stringNew;
    transformerOutput = transformerInner(string);
    stringNew = transformerOutput.toString();
  }
  let squiggleString = stringNew;
  let lognormalParameters = toLognormalParameters(transformerOutput);
  let shortGuesstimateString = toShortGuesstimateString(transformerOutput);
  let array90CI = to90CIArray(transformerOutput);
  // console.log(transformerOutput);
  let result = {
    squiggleString: squiggleString,
    lognormalParameters: lognormalParameters,
    shortGuesstimateString: shortGuesstimateString,
    array90CI: array90CI,
  };
  return result;
}
