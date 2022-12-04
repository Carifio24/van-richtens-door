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
const COLORS = ["blue", "orange", "yellow", "purple", "green"];

const PUZZLES = [
    { rowCount: 3, columnCount: 3, initialConfiguration: [[0,1,0], [1,1,1], [0,1,0]], numberOfTries: 3, colorCount: 3 }, // Solution (3): [(1,1)]
    { rowCount: 3, columnCount: 3, initialConfiguration: [[1,2,0], [1,2,0], [2,0,0]], numberOfTries: 4, colorCount: 3 }, // Solution (2): [(1,0), (0,0)]
    { rowCount: 3, columnCount: 3, initialConfiguration: [[0,0,1], [2,2,1], [0,1,2]], numberOfTries: 10, colorCount: 3 }, // Solution (4): [(1,1), (1,0), (2,2), (2,2)]
    { rowCount: 3, columnCount: 3, initialConfiguration: [[3,2,0], [3,2,1], [1,1,2]], numberOfTries: 10, colorCount: 4 } // Solution (4): [(1,1), (0,1), (2,2), (2,2)]
];

///// Initial setup
let count, disabled;
const puzzleIterator = PUZZLES.values();
let puzzleResult = puzzleIterator.next();
setup(puzzleResult.value);

document.onfullscreenchange = (_event) => {
    const fsButton = $("#fs-button");
    if (document.fullscreenElement) {
        fsButton.hide();
    } else {
        fsButton.show();
    }
}

function nextColor(color, colorCount) {
    const index = COLORS.indexOf(color);
    const newIndex = (index + 1) % colorCount;
    return COLORS[newIndex];
}

const adjacencyTypes = {
    cross: (row, col) => [[row + 1, col], [row, col - 1], [row - 1, col], [row, col + 1]],
    topRight: (row, col) => [[row, col - 1], [row + 1, col - 1], [row + 1, col]],
    topLeft: (row, col) => [[row, col + 1], [row + 1, col + 1], [row + 1, col]],
    topCenterT: (row, col) => [[row, col - 1], [row, col + 1], [row + 1, col]],
    bottomCenterT: (row, col) => [[row, col - 1], [row, col + 1], [row - 1, col]],
    bottomLeft: (row, col) => [[row - 1, col], [row - 1, col + 1], [row, col + 1]],
    bottomRight: (row, col) => [[row, col - 1], [row - 1, col], [row - 1, col - 1]]
}

let adjacent = adjacencyTypes.cross;

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
            const color = COLORS[puzzle.initialConfiguration[row][col]];
            result += `<img id="${gemID(row, col)}" src="res/gem.png" onclick="handlePress(${row}, ${col})" class="gem ${color}"/>`
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
        gem.get(0).className = `gem ${className}`;
    });
}

function finish() {}

function failAndReset(puzzle) {
    disabled = true;
    setTimeout(() => {
        setAllGemsToClass(puzzle, FAIL);
        setTimeout(() => {
            setup(puzzle);
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

function allSame(puzzle) {
    return COLORS.some(color => gems(puzzle).every(gem => gem.hasClass(color)));
}

function updateColors(row, col, adjacent, stop) {
    // If the buttons are disabled,
    // or the gem number is outside of the range 1-nGems,
    // do nothing
    const puzzle = puzzleResult.value;
    if (disabled
        || row < 0
        || row >= puzzle.rowCount
        || col < 0
        || col >= puzzle.columnCount
    ) { return; }
    
    // Get the element and adjacent positions
    const jqElement = $(gemSelector(row, col));
    const element = jqElement.get(0);
    const adjacentSpaces = adjacent(row, col);

    // Set the class of this element
    const color = element.classList[1];
    const newColor = nextColor(color, puzzle.colorCount);
    jqElement.removeClass(color);
    jqElement.addClass(newColor);

    // If this is the initial gem in the chain,
    // then update all adjacent gems
    if (!stop) {
        for (const pos of adjacentSpaces) {
            updateColors(pos[0], pos[1], adjacent, true);
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

    const puzzle = puzzleResult.value; 
    const adjacent = adjacencyTypes[puzzle.adjacent || "cross"];
    updateColors(row, col, adjacent, false);

    const complete = allSame(puzzle);
    if (complete) {
        handlePuzzleComplete();
    } else if (!stop) {
        count += 1;
        if (count >= puzzle.numberOfTries && !complete) {
            failAndReset(puzzle);
        }
    }
}
