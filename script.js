// This file has only one dependency, which is jQuery

// For the puzzles:
// I made up most of these myself, but here's a nice resource for generating more:
// https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/flip.html

/// Global variables
const SELECTED = "selected";
const FAIL = "fail";
const COMPLETE = "complete";
const INVISIBLE = "invisible";
const GEM_CONTAINER = $("#gem-container");
const TRANSITION_MS = 750;
const PUZZLES = [
    { rowCount: 1, columnCount: 6, initialSelections: [[0,0], [0,2], [0,3]], numberOfTries: 4 }, // Solution (4): [2,4,0,1]
    { rowCount: 1, columnCount: 7, initialSelections: [[0,1], [0,5]], numberOfTries: 5 }, // Solution (5): [1,2,3,4,5],
    { rowCount: 2, columnCount: 3, initialSelections: [], numberOfTries: 2 }, // Solution (2): [(0,0), (1,2)]
    { rowCount: 3, columnCount: 3, initialSelections: [[0,0], [1,1], [2,2]], numberOfTries: 2 }, // Solution(2): [(0,2), (2,0)]
    { rowCount: 3, columnCount: 3, initialSelections: [], numberOfTries: 5 }, // Solution (5): [(2,0), (2,2), (0,2), (0,0), (1,1)]
    { rowCount: 4, columnCount: 4, initialSelections: [[0,0], [0,1], [1,0], [2,0], [2,1], [2,3], [3,3]], numberOfTries: 6 }, // Solution (6): [(0,1), (1,0), (1,1), (1,3), (2,2), (3,0)]
    { rowCount: 2, columnCount: 5, initialSelections: [[0,0], [0,2], [0,3], [1,1]], numberOfTries: 4 }, // Solution (4): [(0,3), (1,1), (1,2), (1,3)]
    { rowCount: 3, columnCount: 5, initialSelections: [[0,0], [0,2], [1,2], [1,3], [1,4], [2,4]], numberOfTries: 5 }, // Solution (5): [(0,2), (1,2), (1,4), (2,0), (2,4)]
    { rowCount: 2, columnCount: 4, initialSelections: [[0,1], [1,3]], numberOfTries: 12 }, // Solution (7): [(0,0), (0,3), (0,1), (1,0), (0,2), (1,1), (1,3)]
    { rowCount: 3, columnCount: 3, initialSelections: [[0,1], [2,1]], numberOfTries: 2, invisible: [[1,1]] }, // Solution (2): [(1, 0), (1, 2)]
    { rowCount: 4, columnCount: 4, initialSelections: [[0,1], [1,0], [1,2], [2,1], [2,2]], invisible: [[0,0], [0,3], [3,0], [3,3]], numberOfTries: 5 } // Solution (5): [(1,1), (3,2), (2,0), (0,2), (2,3)]
];

///// Initial setup
let count = 0;
let disabled = false;
const puzzleIterator = PUZZLES.values();
let puzzleResult = puzzleIterator.next();
generate(puzzleResult.value);

document.onfullscreenchange = (_event) => {
    const fsButton = $("#fs-button");
    if (document.fullscreenElement) {
        fsButton.hide();
    } else {
        fsButton.show();
    }
}

////// Functions

// A simple containment check for our entries
// all of which are just arrays of numbers
function contains(array, item) {
    if (!array) { return false; }
    return array.some((el) => {
        for (let i = 0; i < item.length; i++) {
            if (i >= el.length || el[i] !== item[i]) {
                return false;
            }
        }
        return true;
    });
}

function makeFullscreen() {
    const door = $("#door").get(0);
    if (door.requestFullscreen) {
        door.requestFullscreen();
    }
}

function gemID(row, column) {
    return `i${row}-${column}`;
}

function gemSelector(row, column) {
    return `#${gemID(row, column)}`;
}

function gemSelectors(puzzle) {
    let selectors = [];
    for (let row = 0; row < puzzle.rowCount; row++) {
        for (let col = 0; col < puzzle.columnCount; col++) {
            if (!contains(puzzle.invisible, [row,col])) {
                selectors.push(gemSelector(row, col));
            }
        }
    }
    return selectors;
}

function gems(puzzle) {
    return gemSelectors(puzzle).map(selector => $(selector));
}

function content(puzzle) {
    let result = ``;
    
    for (let row = 0; row < puzzle.rowCount; row++) {
        result += `<div id="row${row}" class="container-row">`;
        for (let col = 0; col < puzzle.columnCount; col++) {
            result += `<img id="${gemID(row, col)}" src="res/gem.png" onclick="handlePress(${row}, ${col})" class="gem`
            if (contains(puzzle.initialSelections, [row,col])) {
                result += " selected";
            }
            if (contains(puzzle.invisible, [row,col])) {
                result += " invisible";
            }
            result += `"/>`;
        }
        result += "</div>";
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

    for (let row = 0; row < puzzle.rowCount; row++) {
        for (let col = 0; col < puzzle.columnCount; col++) {
            const selected = contains(startSelected, [row,col]);
            const element = $(gemSelector(row, col));
            if (selected) {
                element.addClass(SELECTED);
            } else {
                element.removeClass(SELECTED);
            }
            element.removeClass(FAIL);
        }
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
        }, TRANSITION_MS);
    }, TRANSITION_MS);
}

function completeAndAdvance(puzzle, nextPuzzle) {
    disabled = true;
    setTimeout(() => {
        setAllGemsToClass(puzzle, COMPLETE);
        setTimeout(() => {
            setup(nextPuzzle);
        }, TRANSITION_MS);
    }, TRANSITION_MS);
}

function allSelected(puzzle) {
    return gems(puzzle).every(gem => gem.hasClass(SELECTED));
}

function updateColors(row, col, stop) {
    // If the buttons are disabled,
    // or the gem number is outside of the range 1-nGems,
    // do nothing
    if (disabled
        || row < 0
        || row >= puzzleResult.value.rowCount
        || col < 0
        || col >= puzzleResult.value.columnCount
    ) { return; }
    
    // Get the element and adjacent positions
    const element = $(gemSelector(row, col));
    const adjacent = [[row + 1, col], [row, col - 1], [row - 1, col], [row, col + 1]];

    // Set the class of this element
    if (element.hasClass(SELECTED)) {
        element.removeClass(SELECTED);
    } else {
        element.addClass(SELECTED);
    }

    // If this is the initial gem in the chain,
    // then update all adjacent gems
    if (!stop) {
        for (const pos of adjacent) {
            updateColors(pos[0], pos[1], true);
        }
    }

}

function handlePuzzleComplete() {
    const currentPuzzle = puzzleResult.value;
    puzzleResult = puzzleIterator.next();
    if (puzzleResult.done) {
        setAllGemsToClass(currentPuzzle, COMPLETE);
        finish();
        return;
    }
    completeAndAdvance(currentPuzzle, puzzleResult.value);
}

function handlePress(row, col, stop) {

    updateColors(row, col, false);
    const puzzle = puzzleResult.value;

    const complete = allSelected(puzzle);
    if (complete) {
        handlePuzzleComplete();
    } else if (!stop) {
        count += 1;
        if (count >= puzzle.numberOfTries && !complete) {
            failAndReset(puzzle);
        }
    }
}
