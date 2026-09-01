export const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
export let transpositionTable = new Map();

// 초기 체스판 생성 및 내보내기
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
                const val = pieceValues[p.type];
                score += (p.color === 'w' ? val : -val);
            }
        }
    }
    return score;
}
