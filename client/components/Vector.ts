export interface IVector {
  euclideanDistance(other: this): number;
  toArray(): number[];
}

export class Vector3D implements IVector {
  constructor(
    public x: number,
    public y: number,
    public z: number
  ) {}

  euclideanDistance(other: Vector3D) {
    let xd = other.x - this.x;
    let yd = other.y - this.y;
    let zd = other.z - this.z;

    return Math.sqrt(
      xd * xd + yd * yd + zd * zd
    );
  }

  scalarMultiply(scalar: number) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  add(other: Vector3D, scalar: number = 1) {
    this.x += other.x * scalar;
    this.y += other.y * scalar;
    this.z += other.z * scalar;
    return this;
  }
  
  toArray() {
    return [ this.x, this.y, this.z ];
  }
}

export class Vector2D implements IVector {
  constructor(
    public x: number,
    public y: number
  ) {}

  euclideanDistance(other: Vector2D) {
    let xd = other.x - this.x;
    let yd = other.y - this.y;

    return Math.sqrt(
      xd * xd + yd * yd
    );
  }

  toArray() {
    return [ this.x, this.y ];
  }
}

export class Vector1D implements IVector {
  constructor(
    public x: number
  ) {}

  euclideanDistance(other: Vector1D) {
    return Math.abs(other.x - this.x);
  }

  toArray() {
    return [ this.x ];
  }
}
