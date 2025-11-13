// Beam Search Agent for JavaScript Tetris

const BEAM_WIDTH = 5;
const BEAM_DEPTH = 1;

const BEAM_WEIGHTS = {
  aggregateHeight: -0.51,
  completeLines: 0.76,
  holes: -0.36,
  bumpiness: -0.18,
  wellDepth: -0.20,
  maxHeight: -0.40,
  roughness: -0.25
};

function beam_copyBlocks(src) {
  const dst = new Array(nx);
  for (let x = 0; x < nx; x++) {
    dst[x] = new Array(ny);
    for (let y = 0; y < ny; y++) dst[x][y] = src[x][y];
  }
  return dst;
}

function beam_placePiece(board, type, x, y, dir) {
  const b = beam_copyBlocks(board);
  eachblock(type, x, y, dir, (ix, iy) => b[ix][iy] = type);
  return b;
}

function beam_clearFullLines(board) {
  for (let y = ny - 1; y >= 0; y--) {
    let full = true;
    for (let x = 0; x < nx; x++) if (board[x][y] === 0) { full = false; break; }
    if (full) {
      for (let yy = y; yy >= 1; yy--)
        for (let x = 0; x < nx; x++) board[x][yy] = board[x][yy - 1];
      for (let x = 0; x < nx; x++) board[x][0] = 0;
      y++;
    }
  }
  return board;
}

function beam_evaluate(board) {
  let agg = 0, lines = 0, holes = 0, bump = 0, maxH = 0, well = 0, rough = 0;
  const h = new Array(nx).fill(0);
  for (let x = 0; x < nx; x++) {
    for (let y = 0; y < ny; y++) if (board[x][y] !== 0) { h[x] = ny - y; break; }
    agg += h[x]; if (h[x] > maxH) maxH = h[x];
  }
  for (let y = 0; y < ny; y++) {
    let full = true;
    for (let x = 0; x < nx; x++) if (board[x][y] === 0) { full = false; break; }
    if (full) lines++;
  }
  for (let x = 0; x < nx; x++) {
    let seen = false;
    for (let y = 0; y < ny; y++) {
      if (board[x][y] !== 0) seen = true;
      else if (seen) holes++;
    }
    const left = (x === 0) ? ny : h[x - 1];
    const right = (x === nx - 1) ? ny : h[x + 1];
    const d = Math.max(0, Math.min(left, right) - h[x]);
    well += d * d;
  }
  for (let x = 0; x < nx - 1; x++) {
    const d = Math.abs(h[x] - h[x + 1]);
    bump += d;
    rough += d * d;
  }
  return (
    BEAM_WEIGHTS.aggregateHeight * agg +
    BEAM_WEIGHTS.completeLines * lines +
    BEAM_WEIGHTS.holes * holes +
    BEAM_WEIGHTS.bumpiness * bump +
    BEAM_WEIGHTS.wellDepth * well +
    BEAM_WEIGHTS.maxHeight * maxH +
    BEAM_WEIGHTS.roughness * rough
  );
}

function beam_dropY(type, x, dir) {
  let y = 0;
  while (!occupied(type, x, y + 1, dir)) y++;
  return y;
}

function beam_generateMoves(piece) {
  const moves = [];
  for (let dir = 0; dir < 4; dir++) {
    for (let x = 0; x <= nx - piece.type.size; x++) {
      if (occupied(piece.type, x, 0, dir)) continue;
      const y = beam_dropY(piece.type, x, dir);
      const placed = beam_placePiece(blocks, piece.type, x, y, dir);
      const cleared = beam_clearFullLines(placed);
      const score = beam_evaluate(cleared);
      moves.push({ x, y, dir, board: cleared, score });
    }
  }
  moves.sort((a, b) => b.score - a.score);
  return moves;
}

function beamSearch(piece, width = BEAM_WIDTH, depth = BEAM_DEPTH) {
  let frontier = beam_generateMoves(piece).slice(0, width);
  for (let d = 1; d < depth; d++) {
    const next = [];
    for (const node of frontier) next.push(node);
    next.sort((a, b) => b.score - a.score);
    frontier = next.slice(0, width);
  }
  return frontier[0] || null;
}

function selectBestMove_Beam(piece) {
  const r = beamSearch(piece, BEAM_WIDTH, BEAM_DEPTH);
  return r ? { piece, x: r.x, y: r.y, board: r.board, dir: r.dir } : null;
}
