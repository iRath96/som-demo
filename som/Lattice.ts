export abstract class Lattice {
  abstract calculatePosition(x: number, y: number): number[];
}

export default Lattice;

export class SquareLattice extends Lattice {
  calculatePosition(x: number, y: number) {
    return [ x, y ];
  }
}

export class HexagonalLattice extends Lattice {
  static readonly X_OFFSET = Math.cos(Math.PI / 3);
  static readonly Y_OFFSET = Math.sin(Math.PI / 3);

  calculatePosition(x: number, y: number) {
    return [
      x + (y % 2) * HexagonalLattice.X_OFFSET,
      y * HexagonalLattice.Y_OFFSET
    ]
  }
}
