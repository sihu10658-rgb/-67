import { createInitialBoard } from './position.js';
import { getAllLegalMoves, inCheck } from './rules.js';
import { findBestMoveIterative } from './engine.js';
import { transpositionTable } from './position.js';

export class ChessGame {
    constructor() {
        this.board = createInitialBoard();
        this.turn = 'w'; // 'w' 또는 'b'
        this.selectedSquare = null;
        this.validMoves = [];
        this.isGameOver = false;
        this.moveHistory = [];
    }

    getPiece(r, c) {
        return this.board[r][c];
    }

    selectSquare(r, c) {
        const piece = this.board[r][c];
        if (piece && piece.color === this.turn) {
            this.selectedSquare = { r, c };
            this.validMoves = getAllLegalMoves(this.turn, this.board)
                .filter(m => m.from.r === r && m.from.c === c)
                .map(m => m.to);
            return true;
        } else {
            this.clearSelection();
            return false;
        }
    }

    clearSelection() {
        this.selectedSquare = null;
        this.validMoves = [];
    }

    makeMove(fromR, fromC, toR, toC) {
        const piece = this.board[fromR][fromC];
        if (!piece) return false;

        // 이동 수행
        this.board[toR][toC] = piece;
        this.board[fromR][fromC] = null;

        // 폰 프로모션 (끝까지 가면 퀸으로 변환)
        if (piece.type.toLowerCase() === 'p' && (toR === 0 || toR === 7)) {
            this.board[toR][toC].type = piece.color === 'w' ? 'Q' : 'q';
        }

        this.moveHistory.push({ from: { r: fromR, c: fromC }, to: { r: toR, c: toC } });
        this.turn = this.turn === 'w' ? 'b' : 'w';
        this.clearSelection();

        // 게임 종료 조건 체크
        const legalMoves = getAllLegalMoves(this.turn, this.board);
        if (legalMoves.length === 0) {
            this.isGameOver = true;
        }

        return true;
    }

    executeAIMove() {
        if (this.isGameOver || this.turn !== 'b') return null;
        transpositionTable.clear();

        const bestMove = findBestMoveIterative(this.board, 10);
        if (!bestMove) return null;

        this.makeMove(bestMove.from.r, bestMove.from.c, bestMove.to.r, bestMove.to.c);
        return bestMove;
    }
}
