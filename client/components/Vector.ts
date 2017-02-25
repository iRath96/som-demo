export interface IVector {
  euclideanDistance(other: this): number;
  manhattenDistance(other: this): number;

  toArray(): number[];

  zero(): this;
  clone(): this;
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

  manhattenDistance(other: Vector3D) {
    let xd = other.x - this.x;
    let yd = other.y - this.y;
    let zd = other.z - this.z;

    return Math.abs(xd) + Math.abs(yd) + Math.abs(zd);
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

  zero() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    return this;
  }

  clone() {
    return new Vector3D(this.x, this.y, this.z) as this;
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

  manhattenDistance(other: Vector2D) {
    let xd = other.x - this.x;
    let yd = other.y - this.y;

    return Math.abs(xd) + Math.abs(yd);
  }

  toArray() {
    return [ this.x, this.y ];
  }

  zero() {
    this.x = 0;
    this.y = 0;
    return this;
  }

  clone() {
    return new Vector2D(this.x, this.y) as this;
  }
}

export class Vector1D implements IVector {
  constructor(
    public x: number
  ) {}

  euclideanDistance(other: Vector1D) {
    return Math.abs(other.x - this.x);
  }

  manhattenDistance(other: Vector1D) {
    return Math.abs(other.x - this.x);
  }

  toArray() {
    return [ this.x ];
  }

  zero() {
    this.x = 0;
    return this;
  }

  clone() {
    return new Vector1D(this.x) as this;
  }
}
