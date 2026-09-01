// 기물 잡기 가치 평가 (MVV-LVA 기초: 가치 낮은 기물로 높은 기물을 잡는 수 우선)
function getMoveScore(move, currentBoard) {
    const target = currentBoard[move.to.r][move.to.c];
    const piece = currentBoard[move.from.r][move.from.c];
    if (!target) return 0; // 기물을 잡지 않는 일반 이동은 후순위

    const attackerVal = pieceValues[piece.type.toLowerCase()];
    const targetVal = pieceValues[target.type.toLowerCase()];
    return targetVal * 10 - attackerVal; // 높은 가치 기물을 잡을수록 점수 부여
}

// 합법적인 이동 목록을 가치 순으로 정렬하는 무브 오더링 함수
function getSortedMoves(color, currentBoard) {
    let moves = getAllLegalMoves(color, currentBoard);
    
    // 각 이동에 점수를 매겨 내림차순 정렬 (좋은 수가 맨 먼저 탐색됨)
    moves.sort((a, b) => {
        return getMoveScore(b, currentBoard) - getMoveScore(a, currentBoard);
    });
    
    return moves;
}
