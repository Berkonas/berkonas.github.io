// Rotation math. Quaternions are [w, x, y, z] (Hamilton, scalar first);
// matrices are row-major 3×3 arrays, R[row][col]. All rotations are active.

export const EPS = 1e-12;

export function qNormalize(q) {
  const n = Math.hypot(q[0], q[1], q[2], q[3]);
  return n < EPS ? [1, 0, 0, 0] : q.map((v) => v / n);
}

export function qMul(a, b) {
  return [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
  ];
}

export function qConj(q) {
  return [q[0], -q[1], -q[2], -q[3]];
}

export function qFromAxisAngle(axis, angle) {
  const n = Math.hypot(axis[0], axis[1], axis[2]);
  if (n < EPS || Math.abs(angle) < EPS) return [1, 0, 0, 0];
  const s = Math.sin(angle / 2) / n;
  return [Math.cos(angle / 2), axis[0] * s, axis[1] * s, axis[2] * s];
}

// Angle in [0, π] and a unit axis. The identity reports angle 0 about Z.
export function qToAxisAngle(q) {
  let [w, x, y, z] = qNormalize(q);
  if (w < 0) [w, x, y, z] = [-w, -x, -y, -z];
  const s = Math.hypot(x, y, z);
  if (s < 1e-12) return { axis: [0, 0, 1], angle: 0 };
  return { axis: [x / s, y / s, z / s], angle: 2 * Math.atan2(s, w) };
}

export function qToMatrix(q) {
  const [w, x, y, z] = qNormalize(q);
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)],
    [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
    [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)],
  ];
}

// Shepperd's method: pick the largest pivot for numerical stability.
export function qFromMatrix(R) {
  const t = R[0][0] + R[1][1] + R[2][2];
  let q;
  if (t > R[0][0] && t > R[1][1] && t > R[2][2]) {
    const s = 2 * Math.sqrt(1 + t);
    q = [s / 4, (R[2][1] - R[1][2]) / s, (R[0][2] - R[2][0]) / s, (R[1][0] - R[0][1]) / s];
  } else if (R[0][0] > R[1][1] && R[0][0] > R[2][2]) {
    const s = 2 * Math.sqrt(1 + R[0][0] - R[1][1] - R[2][2]);
    q = [(R[2][1] - R[1][2]) / s, s / 4, (R[0][1] + R[1][0]) / s, (R[0][2] + R[2][0]) / s];
  } else if (R[1][1] > R[2][2]) {
    const s = 2 * Math.sqrt(1 + R[1][1] - R[0][0] - R[2][2]);
    q = [(R[0][2] - R[2][0]) / s, (R[0][1] + R[1][0]) / s, s / 4, (R[1][2] + R[2][1]) / s];
  } else {
    const s = 2 * Math.sqrt(1 + R[2][2] - R[0][0] - R[1][1]);
    q = [(R[1][0] - R[0][1]) / s, (R[0][2] + R[2][0]) / s, (R[1][2] + R[2][1]) / s, s / 4];
  }
  return qNormalize(q[0] < 0 ? q.map((v) => -v) : q);
}

export function det3(M) {
  return (
    M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
    M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
    M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
  );
}

function inverseTranspose(M) {
  const d = det3(M);
  const c = (r, k) => {
    const rows = [0, 1, 2].filter((i) => i !== r);
    const cols = [0, 1, 2].filter((i) => i !== k);
    const m = M[rows[0]][cols[0]] * M[rows[1]][cols[1]] - M[rows[0]][cols[1]] * M[rows[1]][cols[0]];
    return ((r + k) % 2 ? -m : m) / d;
  };
  // (M⁻¹)ᵀ is the cofactor matrix over the determinant.
  return [0, 1, 2].map((r) => [0, 1, 2].map((k) => c(r, k)));
}

// How far a matrix is from orthonormal: max |RᵀR − I|.
export function orthoError(M) {
  let err = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let dot = 0;
      for (let k = 0; k < 3; k++) dot += M[k][i] * M[k][j];
      err = Math.max(err, Math.abs(dot - (i === j ? 1 : 0)));
    }
  }
  return err;
}

// Nearest rotation by polar decomposition (Higham's iteration).
export function nearestRotation(M) {
  let R = M.map((row) => row.slice());
  for (let n = 0; n < 40; n++) {
    const T = inverseTranspose(R);
    const next = R.map((row, i) => row.map((v, j) => (v + T[i][j]) / 2));
    const change = Math.max(...next.flat().map((v, k) => Math.abs(v - R.flat()[k])));
    R = next;
    if (change < 1e-14) break;
  }
  return R;
}

// --- Euler angles -------------------------------------------------------------

const AXIS = { X: 0, Y: 1, Z: 2 };

function qAxis(i, angle) {
  const q = [Math.cos(angle / 2), 0, 0, 0];
  q[i + 1] = Math.sin(angle / 2);
  return q;
}

// Intrinsic sequence "ZYX" with angles [a, b, c]: R = Rz(a) Ry(b) Rx(c).
// Extrinsic "XYZ" with [a, b, c] rotates about fixed X, then Y, then Z,
// which is the same as intrinsic "ZYX" with the angles reversed.
export function eulerToQuat(seq, angles, extrinsic) {
  const axes = seq.split("").map((c) => AXIS[c]);
  let order = axes;
  let ang = angles;
  if (extrinsic) {
    order = axes.slice().reverse();
    ang = angles.slice().reverse();
  }
  return qNormalize(qMul(qMul(qAxis(order[0], ang[0]), qAxis(order[1], ang[1])), qAxis(order[2], ang[2])));
}

// Levi-Civita sign of (i, j, k): +1 for X→Y→Z order, −1 otherwise.
function parity(i, j, k) {
  return (i - j) * (j - k) * (k - i) / 2;
}

// Returns { angles, gimbal }. Tait–Bryan middle angle in [−π/2, π/2],
// proper Euler middle angle in [0, π]; the outer angles in (−π, π].
export function quatToEuler(seq, q, extrinsic) {
  const R = qToMatrix(q);
  const intrinsicSeq = extrinsic ? seq.split("").reverse().join("") : seq;
  const [i, j, last] = intrinsicSeq.split("").map((c) => AXIS[c]);
  let a;
  let b;
  let c;
  let gimbal = false;
  const LOCK = 1e-7;
  if (i !== last) {
    // Tait–Bryan: R = Ri(a) Rj(b) Rk(c)
    const k = last;
    const s = parity(i, j, k);
    const sb = Math.max(-1, Math.min(1, s * R[i][k]));
    b = Math.asin(sb);
    if (Math.abs(Math.abs(sb) - 1) < LOCK) {
      gimbal = true;
      c = 0;
      a = Math.atan2(s * R[k][j], R[j][j]);
    } else {
      a = Math.atan2(-s * R[j][k], R[k][k]);
      c = Math.atan2(-s * R[i][j], R[i][i]);
    }
  } else {
    // Proper Euler: R = Ri(a) Rj(b) Ri(c), with k the remaining axis.
    const k = 3 - i - j;
    const s = parity(i, j, k);
    const cb = Math.max(-1, Math.min(1, R[i][i]));
    b = Math.acos(cb);
    if (Math.abs(Math.abs(cb) - 1) < LOCK) {
      gimbal = true;
      c = 0;
      a = Math.atan2(s * R[k][j], R[j][j]);
    } else {
      a = Math.atan2(R[j][i], -s * R[k][i]);
      c = Math.atan2(R[i][j], s * R[i][k]);
    }
  }
  const angles = extrinsic ? [c, b, a] : [a, b, c];
  return { angles, gimbal };
}

export function matMul(A, B) {
  return A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
}

export function matVec(R, v) {
  return R.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
}

// Uniformly random rotation (Shoemake).
export function qRandom() {
  const u1 = Math.random();
  const u2 = Math.random() * 2 * Math.PI;
  const u3 = Math.random() * 2 * Math.PI;
  const a = Math.sqrt(1 - u1);
  const b = Math.sqrt(u1);
  const q = [b * Math.cos(u3), a * Math.sin(u2), a * Math.cos(u2), b * Math.sin(u3)];
  return q[0] < 0 ? q.map((v) => -v) : q;
}
