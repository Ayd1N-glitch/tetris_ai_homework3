// ===========================================
//  Advanced Heuristic Agent for Tetris
//  Improved version by Aydin Mammadzada
// ===========================================

// Adjustable weights for heuristic evaluation
const WEIGHTS = {
    aggregateHeight: -0.51,
    completeLines: 0.76,
    holes: -0.36,
    bumpiness: -0.18,
    wellDepth: -0.20,        // NEW: penalty for deep wells
    maxHeight: -0.40,        // NEW: penalty for tallest column
    roughness: -0.25         // NEW: penalty for uneven height changes
};

// Evaluate the given board configuration
function evaluateBoard(board) {
    let aggregateHeight = 0;
    let completeLines = 0;
    let holes = 0;
    let bumpiness = 0;
    let maxHeight = 0;
    let wellDepth = 0;
    let roughness = 0;

    let columnHeights = new Array(nx).fill(0);

    // Calculate column heights
    for (let x = 0; x < nx; x++) {
        for (let y = 0; y < ny; y++) {
            if (board[x][y] !== 0) {
                columnHeights[x] = ny - y;
                aggregateHeight += columnHeights[x];
                maxHeight = Math.max(maxHeight, columnHeights[x]);
                break;
            }
        }
    }

    // Complete lines
    for (let y = 0; y < ny; y++) {
        let complete = true;
        for (let x = 0; x < nx; x++) {
            if (board[x][y] === 0) {
                complete = false;
                break;
            }
        }
        if (complete) completeLines++;
    }

    // Holes and well depth
    for (let x = 0; x < nx; x++) {
        let blockFound = false;
        for (let y = 0; y < ny; y++) {
            if (board[x][y] !== 0) blockFound = true;
            else if (blockFound) holes++;
        }

        // Check for "wells" (deep vertical gaps)
        let left = (x === 0) ? ny : columnHeights[x - 1];
        let right = (x === nx - 1) ? ny : columnHeights[x + 1];
        let depth = Math.max(0, Math.min(left, right) - columnHeights[x]);
        wellDepth += depth * depth; // deeper wells = worse
    }

    // Bumpiness and roughness
    for (let x = 0; x < nx - 1; x++) {
        let diff = Math.abs(columnHeights[x] - columnHeights[x + 1]);
        bumpiness += diff;
        roughness += diff * diff;
    }

    // Combine all heuristic terms
    return (
        WEIGHTS.aggregateHeight * aggregateHeight +
        WEIGHTS.completeLines * completeLines +
        WEIGHTS.holes * holes +
        WEIGHTS.bumpiness * bumpiness +
        WEIGHTS.wellDepth * wellDepth +
        WEIGHTS.maxHeight * maxHeight +
        WEIGHTS.roughness * roughness
    );
}

// Deep copy of blocks array
function copyBlocks(blocks) {
    let new_blocks = [];
    for (let x = 0; x < nx; x++) {
        new_blocks[x] = [];
        for (let y = 0; y < ny; y++) {
            new_blocks[x][y] = blocks[x][y];
        }
    }
    return new_blocks;
}

// Generate all possible moves for the current piece
function getPossibleMoves(piece) {
    let moves = [];
    for (let dir = 0; dir < 4; dir++) {
        piece.dir = dir;
        for (let x = 0; x < nx - piece.type.size; x++) {
            let y = getDropPosition(piece, x);
            let new_blocks = copyBlocks(blocks);
            eachblock(piece.type, x, y, piece.dir, function(x, y) {
                new_blocks[x][y] = piece.type;
            });
            moves.push({ piece: piece, x: x, y: y, board: new_blocks });
        }
    }
    return moves;
}

// Choose the best move based on heuristic score
function selectBestMove(piece, board) {
    let moves = getPossibleMoves(piece);
    let bestMove = null;
    let bestScore = -Infinity;
    moves.forEach(move => {
        let score = evaluateBoard(move.board);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    });
    return bestMove;
}

// Find drop position
function getDropPosition(piece, x) {
    let y = 0;
    while (!occupied(piece.type, x, y + 1, piece.dir)) y++;
    return y;
}
