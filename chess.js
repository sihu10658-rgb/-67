const pieceUnicode = {
    p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
    P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

let board = [
    [{type:'r',color:'b'},{type:'n',color:'b'},{type:'b',color:'b'},{type:'q',color:'b'},{type:'k',color:'b'},{type:'b',color:'b'},{type:'n',color:'b'},{type:'r',color:'b'}],
    Array(8).fill(null).map(() => ({type:'p', color:'b'})),
    Array(8).fill(null), Array(8).fill(null), Array(8).fill(null), Array(8).fill(null),
    Array(8).fill(null).map(() => ({type:'p', color:'w'})),
    [{type:'R',color:'w'},{type:'N',color:'w'},{type:'B',color:'w'},{type:'Q',color:'w'},{type:'K',color:'w'},{type:'B',color:'w'},{type:'N',color:'w'},{type:'R',color:'w'}]
];

let turn = 'w';
let selectedSquare = null;
let validMoves = [];
let isGameOver = false;
let transpositionTable = new Map();

function boardToString(currentBoard, color) {
    let str = color + '_';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = currentBoard[r][c];
            str += p ? p.color + p.type : '.';
        }
    }
    return str;
}

function findKing(color, currentBoard) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = currentBoard[r][c];
            if (p && p.type === 'k' && p.color === color) return { r, c };
        }
    }
    return null;
}

function isSquareAttacked(r, c, attackerColor, currentBoard) {
    for (let ar = 0; ar < 8; ar++) {
        for (let ac = 0; ac < 8; ac++) {
            const p = currentBoard[ar][ac];
            if (p && p.color === attackerColor) {
                if (isValidBasicMove(ar, ac, r, c, currentBoard, true)) return true;
            }
        }
    }
    return false;
}

function inCheck(color, currentBoard) {
    const kingPos = findKing(color, currentBoard);
    if (!kingPos) return false;
    return isSquareAttacked(kingPos.r, kingPos.c, color === 'w' ? 'b' : 'w', currentBoard);
}

function isValidBasicMove(r1, c1, r2, c2, currentBoard, isAttackCheck = false) {
    const piece = currentBoard[r1][c1];
    const target = currentBoard[r2][c2];
    if (!piece) return false;
    if (r1 === r2 && c1 === c2) return false;
    if (target && target.color === piece.color && !isAttackCheck) return false;

    const dr = r2 - r1;
    const dc = c2 - c1;
    const adr = Math.abs(dr);
    const adc = Math.abs(dc);
    const type = piece.type;

    if (type === 'p') {
        const dir = piece.color === 'w' ? -1 : 1;
        const startRow = piece.color === 'w' ? 6 : 1;
        if (c1 === c2 && !target) {
            if (dr === dir) return true;
            if (r1 === startRow && dr === dir * 2 && !currentBoard[r1 + dir][c1]) return true;
        }
        if (adc === 1 && dr === dir && target && target.color !== piece.color) return true;
        return false;
    }
    if (type === 'n') return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
    if (type === 'k') return adr <= 1 && adc <= 1;
    if (type === 'r' || type === 'q') {
        if (r1 === r2 || c1 === c2) return isPathClear(r1, c1, r2, c2, currentBoard);
    }
    if (type === 'b' || type === 'q') {
        if (adr === adc) return isPathClear(r1, c1, r2, c2, currentBoard);
    }
    return false;
}

function isPathClear(r1, c1, r2, c2, currentBoard) {
    const rd = Math.sign(r2 - r1);
    const cd = Math.sign(c2 - c1);
    let currR = r1 + rd, currC = c1 + cd;
    while (currR !== r2 || currC !== c2) {
        if (currentBoard[currR][currC]) return false;
        currR += rd; currC += cd;
    }
    return true;
}

function getAllLegalMoves(color, currentBoard) {
    let allMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = currentBoard[r][c];
            if (piece && piece.color === color) {
                for (let r2 = 0; r2 < 8; r2++) {
                    for (let c2 = 0; c2 < 8; c2++) {
                        if (isValidBasicMove(r, c, r2, c2, currentBoard)) {
                            const tempBoard = currentBoard.map(row => row.map(cell => cell ? { ...cell } : null));
                            tempBoard[r2][c2] = tempBoard[r][c];
                            tempBoard[r][c] = null;
                            if (!inCheck(color, tempBoard)) {
                                allMoves.push({ from: { r, c }, to: { r: r2, c: c2 } });
                            }
                        }
                    }
                }
            }
        }
    }
    return allMoves;
}

function evaluateBoard(currentBoard) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = currentBoard[r][c];
            if (p) {
                const val = pieceValues[p.type];
                score += (p.color === 'w' ? val : -val);
            }
        }
    }
    return score;
}

function getMoveScore(move, currentBoard) {
    const target = currentBoard[move.to.r][move.to.c];
    const piece = currentBoard[move.from.r][move.from.c];
    if (!target) return 0;
    return pieceValues[target.type.toLowerCase()] * 10 - pieceValues[piece.type.toLowerCase()];
}

function getSortedMoves(color, currentBoard) {
    let moves = getAllLegalMoves(color, currentBoard);
    moves.sort((a, b) => getMoveScore(b, currentBoard) - getMoveScore(a, currentBoard));
    return moves;
}

function quiescenceSearch(currentBoard, alpha, beta, isMaximizing, qDepth = 0) {
    const evalScore = evaluateBoard(currentBoard);
    if (qDepth >= 4) return evalScore;

    if (isMaximizing) {
        if (evalScore >= beta) return beta;
        if (evalScore > alpha) alpha = evalScore;
    } else {
        if (evalScore <= beta) return beta;
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

function minimax(currentBoard, depth, alpha, beta, isMaximizing) {
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

function findBestMoveIterative(currentBoard, maxDepth = 10) {
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

function makeAIMove() {
    if (isGameOver || turn !== 'b') return;
    transpositionTable.clear();

    const bestMove = findBestMoveIterative(board, 10);
    if (!bestMove) return;

    board[bestMove.to.r][bestMove.to.c] = board[bestMove.from.r][bestMove.from.c];
    board[bestMove.from.r][bestMove.from.c] = null;

    if (board[bestMove.to.r][bestMove.to.c].type === 'p' && bestMove.to.r === 7) {
        board[bestMove.to.r][bestMove.to.c].type = 'q';
    }

    turn = 'w';
    renderBoard();
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    const checkedColor = inCheck(turn, board) ? turn : null;
    const kingPos = checkedColor ? findKing(checkedColor, board) : null;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add(((r + c) & 1) === 0 ? 'light' : 'dark');

            if (checkedColor && kingPos && kingPos.r === r && kingPos.c === c) {
                square.classList.add('check');
            } else if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
                square.classList.add('selected');
            } else if (validMoves.some(m => m.r === r && m.c === c)) {
                square.classList.add('highlight');
            }

            const piece = board[r][c];
            if (piece) {
                const key = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
                square.textContent = pieceUnicode[key] || '';
            }

            square.addEventListener('click', () => handleSquareClick(r, c));
            boardEl.appendChild(square);
        }
    }
    updateStatus();

    if (!isGameOver && turn === 'b') {
        setTimeout(makeAIMove, 50);
    }
}

function handleSquareClick(r, c) {
    if (isGameOver || turn !== 'w') return;

    const piece = board[r][c];

    if (selectedSquare) {
        const found = validMoves.find(m => m.r === r && m.c === c);
        if (found) {
            board[r][c] = board[selectedSquare.r][selectedSquare.c];
            board[selectedSquare.r][selectedSquare.c] = null;
            
            if (board[r][c].type === 'p' && r === 0) {
                board[r][c].type = 'q';
            }

            turn = 'b';
            selectedSquare = null;
            validMoves = [];
            renderBoard();
            return;
        }
    }

    if (piece && piece.color === turn) {
        selectedSquare = { r, c };
        validMoves = getAllLegalMoves(turn, board)
            .filter(m => m.from.r === r && m.from.c === c)
            .map(m => m.to);
    } else {
        selectedSquare = null;
        validMoves = [];
    }
    renderBoard();
}

function updateStatus() {
    const statusEl = document.getElementById('status');
    const legalMoves = getAllLegalMoves(turn, board);

    if (legalMoves.length === 0) {
        isGameOver = true;
        if (inCheck(turn, board)) {
            statusEl.textContent = `게임 종료: 체크메이트! ${turn === 'w' ? '흑' : '백'} 승리!`;
        } else {
            statusEl.textContent = `게임 종료: 무승부 (스테일메이트)`;
        }
    } else {
        let text = turn === 'w' ? '백색 차례' : '흑색 차례 (10수 분석 중...)';
        if (inCheck(turn, board)) text += ' ⚠️ (체크!)';
        statusEl.textContent = text;
    }
}

renderBoard();
