import { transpositionTable } from './position.js';

export function findKing(color, currentBoard) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = currentBoard[r][c];
            if (p && p.type.toLowerCase() === 'k' && p.color === color) return { r, c };
        }
    }
    return null;
}

export function isSquareAttacked(r, c, attackerColor, currentBoard) {
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

export function inCheck(color, currentBoard) {
    const kingPos = findKing(color, currentBoard);
    if (!kingPos) return false;
    const attackerColor = color === 'w' ? 'b' : 'w';
    return isSquareAttacked(kingPos.r, kingPos.c, attackerColor, currentBoard);
}

// 기물별 이동 경로 및 장애물 통과 규칙 검증
export function isPathClear(r1, c1, r2, c2, currentBoard) {
    const rd = Math.sign(r2 - r1);
    const cd = Math.sign(c2 - c1);
    let currR = r1 + rd;
    let currC = c1 + cd;
    
    while (currR !== r2 || currC !== c2) {
        if (currentBoard[currR][currC] !== null) return false; // 경로에 기물이 있으면 차단
        currR += rd;
        currC += cd;
    }
    return true;
}

export function isValidBasicMove(r1, c1, r2, c2, currentBoard, isAttackCheck = false) {
    const piece = currentBoard[r1][c1];
    const target = currentBoard[r2][c2];
    
    if (!piece) return false;
    if (r1 === r2 && c1 === c2) return false;
    // 아군 기물이 있는 곳으로는 이동 불가 (체크 판정 예외 제외)
    if (target && target.color === piece.color && !isAttackCheck) return false;

    const dr = r2 - r1;
    const dc = c2 - c1;
    const adr = Math.abs(dr);
    const adc = Math.abs(dc);
    const type = piece.type.toLowerCase();

    // 1. 폰(Pawn) 규칙 및 경로
    if (type === 'p') {
        const dir = piece.color === 'w' ? -1 : 1;
        const startRow = piece.color === 'w' ? 6 : 1;

        // 전진 이동 (경로 확인 포함)
        if (c1 === c2 && !target) {
            if (dr === dir) return true;
            if (r1 === startRow && dr === dir * 2 && !currentBoard[r1 + dir][c1] && !currentBoard[r2][c2]) return true;
        }
        // 대각선 공격
        if (adc === 1 && dr === dir && target && target.color !== piece.color) return true;
        return false;
    }

    // 2. 나이트(Knight) 규칙 (장애물 무시 점프)
    if (type === 'n') {
        return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
    }

    // 3. 킹(King) 규칙
    if (type === 'k') {
        return adr <= 1 && adc <= 1;
    }

    // 4. 룩(Rook) 및 퀸(Queen) 직선 경로
    if (type === 'r' || type === 'q') {
        if (r1 === r2 || c1 === c2) {
            return isPathClear(r1, c1, r2, c2, currentBoard);
        }
    }

    // 5. 비숍(Bishop) 및 퀸(Queen) 대각선 경로
    if (type === 'b' || type === 'q') {
        if (adr === adc) {
            return isPathClear(r1, c1, r2, c2, currentBoard);
        }
    }

    return false;
}

// 킹이 체크에 걸리거나 버려지는 것을 포함한 모든 합법적 이동 추출
export function getAllLegalMoves(color, currentBoard) {
    let allMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = currentBoard[r][c];
            if (piece && piece.color === color) {
                for (let r2 = 0; r2 < 8; r2++) {
                    for (let c2 = 0; c2 < 8; c2++) {
                        // 기본 이동 규칙 및 경로가 유효한지 확인
                        if (isValidBasicMove(r, c, r2, c2, currentBoard)) {
                            // 가상으로 이동을 수행해봄
                            const tempBoard = currentBoard.map(row => row.map(cell => cell ? { ...cell } : null));
                            tempBoard[r2][c2] = tempBoard[r][c];
                            tempBoard[r][c] = null;

                            // 이동 후 내 킹이 여전히 체크 상태라면 이 수는 불법(Illegal)이므로 제외
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
