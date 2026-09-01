export const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
export let transpositionTable = new Map();

export function createInitialBoard() {
    return [
        [{type:'r',color:'b'},{type:'n',color:'b'},{type:'b',color:'b'},{type:'q',color:'b'},{type:'k',color:'b'},{type:'b',color:'b'},{type:'n',color:'b'},{type:'r',color:'b'}],
        Array(8).fill(null).map(() => ({type:'p', color:'b'})),
        Array(8).fill(null), Array(8).fill(null), Array(8).fill(null), Array(8).fill(null),
        Array(8).fill(null).map(() => ({type:'p', color:'w'})),
        [{type:'R',color:'w'},{type:'N',color:'w'},{type:'B',color:'w'},{type:'Q',color:'w'},{type:'K',color:'w'},{type:'B',color:'w'},{type:'N',color:'w'},{type:'R',color:'w'}]
    ];
}

export function boardToString(currentBoard, color) {
    let str = color + '_';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = currentBoard[r][c];
            str += p ? p.color + p.type : '.';
        }
    }
    return str;
}

export function evaluateBoard(currentBoard) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = currentBoard[r][c];
            if (p) {
                const val = pieceValues[p.type.toLowerCase()];
                score += (p.color === 'w' ? val : -val);
            }
        }
    }
    return score;
}
```[cite: 6]

**engine.js**
```javascript
import { pieceValues, transpositionTable, boardToString, evaluateBoard } from './position.js';
import { getAllLegalMoves, inCheck } from './rules.js';

export function getMoveScore(move, currentBoard) {
    const target = currentBoard[move.to.r][move.to.c];
    const piece = currentBoard[move.from.r][move.from.c];
    if (!target) return 0;
    return pieceValues[target.type.toLowerCase()] * 10 - pieceValues[piece.type.toLowerCase()];
}

export function getSortedMoves(color, currentBoard) {
    let moves = getAllLegalMoves(color, currentBoard);
    moves.sort((a, b) => getMoveScore(b, currentBoard) - getMoveScore(a, currentBoard));
    return moves;
}

export function quiescenceSearch(currentBoard, alpha, beta, isMaximizing, qDepth = 0) {
    const evalScore = evaluateBoard(currentBoard);
    if (qDepth >= 4) return evalScore;

    if (isMaximizing) {
        if (evalScore >= beta) return beta;
        if (evalScore > alpha) alpha = evalScore;
    } else {
        if (evalScore <= alpha) return alpha;
        if (evalScore < beta) beta = evalScore;
    }

    const color = isMaximizing ? 'w' : 'b';
    const moves = getSortedMoves(color, currentBoard).filter(m => currentBoard[m.to.r][m.to.c] !== null);

    for (let move of moves) {
        const tempBoard = currentBoard.map(row => row.map(cell => cell ? { ...cell } : null));
        tempBoard[move.to.r][move.to.c] = tempBoard[move.from.r][move.from.c];
        tempBoard[move.from.r][move.from.c] = null;

        let score = quiescenceSearch(tempBoard, alpha, beta, !isMaximizing, qDepth + 1);

        if (isMaximizing) {
            if (score >= beta) return beta;
            if (score > alpha) alpha = score;
        } else {
            if (score <= alpha) return alpha;
            if (score < beta) beta = score;
        }
    }
    return isMaximizing ? alpha : beta;
}

export function minimax(currentBoard, depth, alpha, beta, isMaximizing) {
    const boardKey = boardToString(currentBoard, isMaximizing ? 'w' : 'b') + '_' + depth;
    if (transpositionTable.has(boardKey)) {
        return transpositionTable.get(boardKey);
    }

    if (depth === 0) {
        return quiescenceSearch(currentBoard, alpha, beta, isMaximizing);
    }

    const color = isMaximizing ? 'w' : 'b';
    const moves = getSortedMoves(color, currentBoard);

    if (moves.length === 0) {
        if (inCheck(color, currentBoard)) return isMaximizing ? -50000 : 50000;
        return 0;
    }

    let evalVal;
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let move of moves) {
            const tempBoard = currentBoard.map(row => row.map(cell => cell ? { ...cell } : null));
            tempBoard[move.to.r][move.to.c] = tempBoard[move.from.r][move.from.c];
            tempBoard[move.from.r][move.from.c] = null;

            let evaluation = minimax(tempBoard, depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break;
        }
        evalVal = maxEval;
    } else {
        let minEval = Infinity;
        for (let move of moves) {
            const tempBoard = currentBoard.map(row => row.map(cell => cell ? { ...cell } : null));
            tempBoard[move.to.r][move.to.c] = tempBoard[move.from.r][move.from.c];
            tempBoard[move.from.r][move.from.c] = null;

            let evaluation = minimax(tempBoard, depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break;
        }
        evalVal = minEval;
    }

    transpositionTable.set(boardKey, evalVal);
    return evalVal;
}

export function findBestMoveIterative(currentBoard, maxDepth = 10) {
    const moves = getSortedMoves('b', currentBoard);
    if (moves.length === 0) return null;

    let bestMove = moves[0];

    for (let currentDepth = 1; currentDepth <= maxDepth; currentDepth++) {
        let bestEval = Infinity;
        let currentBestMove = bestMove;

        for (let move of moves) {
            const tempBoard = currentBoard.map(row => row.map(cell => cell ? { ...cell } : null));
            tempBoard[move.to.r][move.to.c] = tempBoard[move.from.r][move.from.c];
            tempBoard[move.from.r][move.from.c] = null;

            let evalScore = minimax(tempBoard, currentDepth - 1, -Infinity, Infinity, true);
            if (evalScore < bestEval) {
                bestEval = evalScore;
                currentBestMove = move;
            }
        }
        bestMove = currentBestMove;
    }
    return bestMove;
}
```[cite: 4]
