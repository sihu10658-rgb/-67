import { ChessGame } from './game.js';
import { getAllLegalMoves, inCheck, findKing } from './rules.js';

const pieceUnicode = {
    p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
    P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

const game = new ChessGame();

function renderBoard() {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;
    boardEl.innerHTML = '';
    
    const checkedColor = inCheck(game.turn, game.board) ? game.turn : null;
    const kingPos = checkedColor ? findKing(checkedColor, game.board) : null;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add(((r + c) & 1) === 0 ? 'light' : 'dark');

            if (checkedColor && kingPos && kingPos.r === r && kingPos.c === c) {
                square.classList.add('check');
            } else if (game.selectedSquare && game.selectedSquare.r === r && game.selectedSquare.c === c) {
                square.classList.add('selected');
            } else if (game.validMoves.some(m => m.r === r && m.c === c)) {
                square.classList.add('highlight');
            }

            const piece = game.getPiece(r, c);
            if (piece) {
                const key = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
                square.textContent = pieceUnicode[key] || '';
            }

            square.addEventListener('click', () => handleSquareClick(r, c));
            boardEl.appendChild(square);
        }
    }
    updateStatus();

    if (!game.isGameOver && game.turn === 'b') {
        setTimeout(() => {
            game.executeAIMove();
            renderBoard();
        }, 50);
    }
}

function handleSquareClick(r, c) {
    if (game.isGameOver || game.turn !== 'w') return;

    if (game.selectedSquare) {
        const found = game.validMoves.find(m => m.r === r && m.c === c);
        if (found) {
            game.makeMove(game.selectedSquare.r, game.selectedSquare.c, r, c);
            renderBoard();
            return;
        }
    }

    game.selectSquare(r, c);
    renderBoard();
}

function updateStatus() {
    const statusEl = document.getElementById('status');
    if (!statusEl) return;
    
    const legalMoves = getAllLegalMoves(game.turn, game.board);

    if (game.isGameOver || legalMoves.length === 0) {
        game.isGameOver = true;
        if (inCheck(game.turn, game.board)) {
            statusEl.textContent = `게임 종료: 체크메이트! ${game.turn === 'w' ? '흑' : '백'} 승리!`;
        } else {
            statusEl.textContent = `게임 종료: 무승부 (스테일메이트)`;
        }
    } else {
        let text = game.turn === 'w' ? '백색 차례' : '흑색 차례 (AI 분석 중...)';
        if (inCheck(game.turn, game.board)) text += ' ⚠️ (체크!)';
        statusEl.textContent = text;
    }
}

renderBoard();
