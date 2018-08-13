const symb = require("./words").symb;
const fourCharWords = require("./words").fourCharWords;
const fs = require("fs");

// Console logging
const chalk = require("chalk");
const log = console.log;
const clearOutput = () => process.stdout.write("\033c");
const onInput = f => stdin.on("data", f);
const formatWordCompletion = (word, charCompleted) =>
  chalk.green(word.slice(0, charCompleted)) + word.slice(charCompleted);

// var words = symb
var words = fourCharWords;

var state = {
  currWordIdx: 0,
  currCharCompleted: 0,
  isLastKeyIncorrect: false,
  currentKey: null,
  startTime: Date.now(),
  currentTime: Date.now(),
  incorrectKeys: 0
};

const isLastWordInList = () => words.length === state.currWordIdx + 1;
const setNextWord = () => {
  isLastWordInList()
    ? (state.currWordIdx = 0)
    : (state.currWordIdx = state.currWordIdx + 1);

  state.currCharCompleted = 0;
};

//  State actions
const setCharCompleted = () => {
  state.currCharCompleted = state.currCharCompleted + 1;
};
const nextCharToBeCompleted = () =>
  words[state.currWordIdx].slice(
    state.currCharCompleted,
    state.currCharCompleted + 1
  );
const isLastCharToBeCompleted = () =>
  words[state.currWordIdx].length === state.currCharCompleted + 1;
const currentWord = () => words[state.currWordIdx];
const nextWord = () =>
  state.currWordIdx !== words.length - 2
    ? words[state.currWordIdx + 1]
    : "--end--";
const isKeyMatching = key => key !== null && key === nextCharToBeCompleted();
const setCurrentKey = key => {
  state.currentKey = key;
};
const setIsLastKeyIncorrect = bool => {
  state.isLastKeyIncorrect = bool;
  bool && (state.incorrectKeys = state.incorrectKeys + 1);
};

// State selectors
const areWordsStillRemaining = () => state.currWordIdx !== words.length - 1;
const wpm = () =>
  Math.round(
    state.currWordIdx / ((state.currentTime - state.startTime) / 1000 / 60)
  );

// node.js get keypress
var stdin = process.stdin;

// without this, we would only get streams once enter is pressed
stdin.setRawMode(true);

// resume stdin in the parent process (node app won't quit all by itself
// unless an error or process.exit() happens)
stdin.resume();
// i don't want binary, do you?
stdin.setEncoding("utf8");

const view = state => {
  clearOutput();

  if (areWordsStillRemaining()) {
    // During Game
    log(
      `Word Prac: ${state.currWordIdx}/${words.length}${
        state.isLastKeyIncorrect ? chalk.red(" Incorrect Key") : ""
      }`
    );
    log(formatWordCompletion(currentWord(), state.currCharCompleted));
    log(formatWordCompletion(nextWord(), 0));
    log(`WPM: ${wpm()}`);
  } else {
    log(chalk.bgGreen("FINISHED"));
    log(
      `WPM: ${Math.round(
        state.currWordIdx / ((state.currentTime - state.startTime) / 1000 / 60)
      )}`
    );
    log(`Incorrect Keys: ${state.incorrectKeys}`);
  }
};

const todaysDate = () => {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1;
  var yyyy = today.getFullYear();

  if (dd < 10) {
    dd = "0" + dd;
  }

  if (mm < 10) {
    mm = "0" + mm;
  }

  return mm + "/" + dd + "/" + yyyy;
};

// File system controls
const writeStateToFile = () => {
  const fileName = "results.json";
  const currJson = JSON.parse(fs.readFileSync(fileName));
  const newJson = JSON.stringify({
    results: currJson.results.concat({
      date: todaysDate(),
      wpm: wpm(),
      averageCharPerWord:
        words.map(w => w.length).reduce((a, b) => a + b) / words.length,
      wordCount: words.length,
      incorrectKeys: state.incorrectKeys
    })
  });
  fs.writeFileSync(fileName, newJson, "utf8");
};

view(state);

onInput(function(key) {
  if (key === "\u0003") {
    process.exit();
  } else {
    setCurrentKey(key);

    setIsLastKeyIncorrect(false);

    isKeyMatching(state.currentKey)
      ? isLastCharToBeCompleted()
        ? setNextWord()
        : setCharCompleted()
      : setIsLastKeyIncorrect(true);

    areWordsStillRemaining() && (state.currentTime = Date.now());

    view(state);

    !areWordsStillRemaining() && writeStateToFile();
  }
});
