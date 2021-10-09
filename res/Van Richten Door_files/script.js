// This final has only one dependency, which is jQuery

/// Global variables
const PASSWORD = "khazan";
const SELECTED = "selected";
const FAIL = "fail";
const COMPLETE = "complete";
const PUZZLES = [
    { gemCount: 6, initialSelections: [0, 2, 3], numberOfTries: 4 }, // Solution: [2,4,0,1]
	//{ gemCount: 7, initialSelections: [1, 3, 5], numberOfTries: 5 }
    { gemCount: 7, initialSelections: [1, 5], numberOfTries: 5 }, // Solution: [1,2,3,4,5]
]
const GEM_CONTAINER = $("#gem-container");

let count = 0;
let disabled = false;
const puzzleIterator = PUZZLES.values();
let puzzleResult = puzzleIterator.next();
generate(puzzleResult.value);

Array
////// Functions
function gemID(gemIndex) {
    return `i${gemIndex}`;
}

function gemSelector(gemIndex) {
    return `#${gemID(gemIndex)}`;
}

function gemSelectors(puzzle) {
    return [...Array(puzzle.gemCount).keys()].map(gem => gemSelector(gem));
}

function gems(puzzle) {
    return gemSelectors(puzzle).map(selector => $(selector));
}

function content(puzzle) {
    let result = ``;
    
    for (let gem = 0; gem < puzzle.gemCount; gem++) {
        result += `<img id="${gemID(gem)}" src="res/gem.png" onclick="handlePress(${gem})" class="gem`
        if (puzzle.initialSelections.indexOf(gem) >= 0) {
            result += ` selected"`;
        }
        result += `"/>`;
    }
    return result;
}

function generate(puzzle) {
    GEM_CONTAINER.append(content(puzzle));
}

function clear() {
    GEM_CONTAINER.empty();
}

function setup(puzzle) {
    clear();
    generate(puzzle);
    disabled = false;
    count = 0;
}

function setAllGemsToClass(puzzle, className) {
    gems(puzzle).forEach(gem => {
        gem.removeClass(SELECTED);
        gem.addClass(className)
    });
}

function finish() {}

function reset(puzzle) {
    const startSelected = puzzle.initialSelections;
    for (let gem = 0; gem < puzzle.gemCount; gem++) {
        const selected = startSelected.indexOf(gem) >= 0;
        const element = $(gemSelector(gem));
        if (selected) {
            element.addClass(SELECTED);
        } else {
            element.removeClass(SELECTED);
        }
        element.removeClass(FAIL);
    }
    count = 0;
    disabled = false;
}

function failAndReset(puzzle) {
    disabled = true;
    setTimeout(() => {
        setAllGemsToClass(puzzle, FAIL);
        setTimeout(() => {
            reset(puzzle);
        }, 500);
    }, 500);
}

function completeAndAdvance(puzzle, nextPuzzle) {
    disabled = true;
    console.log(puzzle);
    console.log(nextPuzzle);
    setTimeout(() => {
        setAllGemsToClass(puzzle, COMPLETE);
        setTimeout(() => {
            setup(nextPuzzle);
        }, 500);
    }, 500);
}

function allSelected(puzzle) {
    console.log(gems(puzzle));
    for (const gem of gems(puzzle)) {
        console.log(gem.hasClass(SELECTED));
    }
    return gems(puzzle).every(gem => gem.hasClass(SELECTED));
}

function updateColors(gemIndex, stop) {
    // If the buttons are disabled,
    // or the gem number is outside of the range 1-nGems,
    // do nothing
    if (disabled || gemIndex < 0 || gemIndex >= puzzleResult.value.gemCount) { return; }
    
    const element = $(gemSelector(gemIndex));
    if ( element.hasClass(SELECTED) ) {
        element.removeClass(SELECTED);
        if (!stop) {
            updateColors(gemIndex + 1, true);
            updateColors(gemIndex - 1, true);
        } 
    } else {
        element.addClass(SELECTED);
        if (!stop) {
            updateColors(gemIndex + 1, true);
            updateColors(gemIndex - 1, true);
        }
    }
}

function handlePuzzleComplete() {
    const currentPuzzle = puzzleResult.value;
    puzzleResult = puzzleIterator.next();
    if (puzzleResult.done) {
        finish();
        return;
    }
    completeAndAdvance(currentPuzzle, puzzleResult.value);
}

function handlePress(gemIndex, stop) {

    updateColors(gemIndex, false);
    console.log(puzzleResult);
    const puzzle = puzzleResult.value;

    const complete = allSelected(puzzle);
    console.log(`complete: ${complete}`);
    if (complete) {
        handlePuzzleComplete();
    } else if (!stop) {
        count += 1;
        console.log(count);
        if (count >= puzzle.numberOfTries && !complete) {
            failAndReset(puzzle);
        }
    }
}
