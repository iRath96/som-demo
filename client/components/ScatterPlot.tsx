import * as React from "react";
import * as THREE from "three";

import Dataset from "som/Dataset";
import Model from "som/Model";


export interface IProps {
  dataset: Dataset;
  currentSample: number[] | null;

  datasetRevision: number;

  model: Model;
  modelRevision: number;

  animating: boolean;
}

export default class ScatterPlot extends React.Component<IProps, void> {
  protected renderer: THREE.WebGLRenderer;
  protected camera: THREE.PerspectiveCamera;
  protected scene: THREE.Scene;

  protected scatterPlot: THREE.Object3D;
  protected coordinateSystem: THREE.Line;

  protected datasetGeometry: THREE.Geometry;
  protected datasetPoints: THREE.ParticleSystem;

  protected sampleIndicatorGeometry: THREE.Geometry;
  protected sampleIndicatorPoints: THREE.ParticleSystem;

  protected mapGeometry: THREE.Geometry;
  protected mapLineSegments: THREE.LineSegments;
  protected weightsToVectors: Map<number, Set<THREE.Vector3>>;

  protected isDirty: boolean = true;

  constructor(props: IProps) {
    super(props);

    // initialize camera
    this.camera = new THREE.PerspectiveCamera(30, 1, 1, 10000);
    this.camera.position.z = 3;
    this.camera.position.x = -1;
    this.camera.position.y = 1;

    // initialize scene
    this.scene = new THREE.Scene();

    // initialize scatter plot
    this.scatterPlot = new THREE.Object3D();
    this.scatterPlot.rotation.y = 0;
    
    this.scene.add(this.scatterPlot);

    // others
    this.initializeCoordinateSystem();
    this.updateDatasetGeometry();
    this.initializeMapGeometry();
    this.initializeSampleIndicatorGeometry();
  }

  protected initializeCoordinateSystem() {
    function v(x: number, y: number, z: number) {
      return new THREE.Vector3(x, y, z);
    }

    interface IVec {
      [key: string]: number;

      x: number;
      y: number;
      z: number;
    }

    const vpts: { min: IVec, max: IVec } = {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 1, y: 1, z: 1 }
    };

    let black = new THREE.Color(0, 0, 0);
    let gray = new THREE.Color(0.8, 0.8, 0.8);

    let lineGeo = new THREE.Geometry();
    lineGeo.vertices.push(
      v(vpts.min.x, vpts.min.y, vpts.min.z), v(vpts.max.x, vpts.min.y, vpts.min.z),
      v(vpts.min.x, vpts.min.y, vpts.min.z), v(vpts.min.x, vpts.max.y, vpts.min.z),
      v(vpts.min.x, vpts.min.y, vpts.min.z), v(vpts.min.x, vpts.min.y, vpts.max.z)
    );

    for (let i = 0; i < 6; ++i)
      lineGeo.colors.push(black);

    let axes = [ "x", "y", "z" ];
    axes.forEach(axis => {
      let others = axes.filter(a => a !== axis);
      for (let value = vpts.min[axis] + 0.1; value < vpts.max[axis]; value += 0.1) {
        others.forEach(otherAxis => {
          let a: IVec = { ...vpts.min };
          let b: IVec = { ...vpts.min };

          a[axis] = value;
          b[axis] = value;

          a[otherAxis] = vpts.min[otherAxis];
          b[otherAxis] = vpts.max[otherAxis];

          lineGeo.vertices.push(
            v(a.x, a.y, a.z), v(b.x, b.y, b.z)
          );

          lineGeo.colors.push(
            gray, gray
          );
        });
      }
    });

    lineGeo.applyMatrix(
      new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5)
    );

    let lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,
      linewidth: 2
    });

    this.coordinateSystem = new THREE.Line(lineGeo, lineMat, THREE.LinePieces);
    this.scatterPlot.add(this.coordinateSystem);
  }

  protected updateDatasetGeometry() {
    let needsNewGeometry = !this.datasetGeometry || this.datasetGeometry.vertices.length !== this.props.dataset.sampleCount;

    if (needsNewGeometry) {
      // create new geometry

      if (this.datasetPoints)
        this.scatterPlot.remove(this.datasetPoints);
      
      let mat = new THREE.ParticleBasicMaterial({
        color: 0x222222,
        size: 0.01
      });

      this.datasetGeometry = new THREE.Geometry();

      for (let i = 0; i < this.props.dataset.sampleCount; ++i) {
        let [ x, y, z ] = this.props.dataset.getSample(i);
        this.datasetGeometry.vertices.push(new THREE.Vector3(x, y, z));
      }

      this.datasetPoints = new THREE.ParticleSystem(this.datasetGeometry, mat);
      this.scatterPlot.add(this.datasetPoints);
    } else {
      // update existing geometry
      for (let i = 0; i < this.props.dataset.sampleCount; ++i) {
        let vertex = this.datasetGeometry.vertices[i];
        [ vertex.x, vertex.y, vertex.z ] = this.props.dataset.getSample(i);
      }

      this.datasetGeometry.verticesNeedUpdate = true;
    }

    this.datasetGeometry.applyMatrix(
      new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5)
    );
  }

  protected initializeMapGeometry() {
    this.weightsToVectors = new Map<number, Set<THREE.Vector3>>();
    this.mapGeometry = new THREE.Geometry();

    for (let i = 0; i < this.props.model.neuronCount; ++i) {
      if (!this.weightsToVectors.has(i))
        this.weightsToVectors.set(i, new Set<THREE.Vector3>());
      
      for (let j = 0; j < this.props.model.neuronCount; ++j) {
        if (!this.weightsToVectors.has(j))
          this.weightsToVectors.set(j, new Set<THREE.Vector3>());

        if (this.props.model.distanceMatrix.get(i, j) <= 1) {
          let iW = this.props.model.weightMatrix.getRow(i);
          let jW = this.props.model.weightMatrix.getRow(j);

          let iWT = new THREE.Vector3(iW[0], iW[1], iW[2]);
          let jWT = new THREE.Vector3(jW[0], jW[1], jW[2]);

          this.weightsToVectors.get(i)!.add(iWT);
          this.weightsToVectors.get(j)!.add(jWT);

          this.mapGeometry.vertices.push(
            iWT,
            jWT
          );
        }
      };
    };

    let lineMat = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 1
    });

    this.mapGeometry.applyMatrix(
      new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5)
    );

    if (this.mapLineSegments)
      this.scatterPlot.remove(this.mapLineSegments);

    this.mapLineSegments = new THREE.LineSegments(this.mapGeometry, lineMat);
    this.scatterPlot.add(this.mapLineSegments);
  }

  protected updateMapGeometry() {
    [ ...this.weightsToVectors ].forEach(([ neuronIndex, tvs ]) => {
      let weights = this.props.model.weightMatrix.getRow(neuronIndex);
      tvs.forEach(tv => {
        tv.x = weights[0] - 0.5;
        tv.y = weights[1] - 0.5;
        tv.z = weights[2] - 0.5;
      });
    });

    this.mapGeometry.verticesNeedUpdate = true;
  }

  protected updateAspectRatio() {
    let canvas = this.refs["canvas"] as HTMLCanvasElement;
    let w = canvas.width, h = canvas.height;
    
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);

    canvas.style.width = "";
    canvas.style.height = "";

    this.isDirty = true;
  }

  componentDidMount() {
    let canvas = this.refs["canvas"] as HTMLCanvasElement;

    // initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas
    });
  
    this.renderer.setClearColor(0xEEEEEE, 1.0);

    // update canvas resolution on resize
    let resizeTimeout: any;
    window.addEventListener("resize", e => {
      // throttle to improve performance
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        console.log("resize");
        this.resizeCanvas();
      }, 500);
    });

    this.resizeCanvas();

    // drag handlers
    let down = false;
    let sx = 0,
        sy = 0;
    
    canvas.onmousedown = ev => {
      down = true;
      dx = 0;
      dy = 0;
      sx = ev.clientX;
      sy = ev.clientY;
    };

    window.onmouseup = () => {
      down = false;
    };

    let dx: number = 0, dy: number = 0;

    let lastMouseMove = new Date().getTime();
    window.onmousemove = ev => {
      let t = new Date().getTime();
      let deltaT = t - lastMouseMove;
      lastMouseMove = t;

      if (down) {
        let timeFactor = Math.max(deltaT / 1000 * 60, 0.001);

        dx = (ev.clientX - sx) / timeFactor;
        dy = (ev.clientY - sy) / timeFactor;

        this.scatterPlot.rotation.y += dx * timeFactor * 0.01;
        this.camera.position.y += dy * timeFactor * 0.01;

        const softMax = (a: number, max: number) =>
          max * (1 / (1 + Math.exp(-4 * a / max)) - 1/2)
        ;

        dx = softMax(dx * 0.5, 40);
        dy = softMax(dy * 0.5, 40);

        sx = ev.clientX;
        sy = ev.clientY;
      }
    }

    let lastT: number = new Date().getTime();
    const animate = () => {
      let t = new Date().getTime();
      let deltaT = t - lastT;
      lastT = t;

      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        // stop moving
        dx = 0;
        dy = 0;
      }

      if (
        this.isDirty ||
        down ||
        dx !== 0 || dy !== 0 ||
        this.props.animating
      ) {
        this.isDirty = false;

        if (!down) {
          let timeFactor = deltaT / 1000 * 60;

          dx *= Math.pow(0.99, timeFactor);
          dy *= Math.pow(0.95, timeFactor);
          this.scatterPlot.rotation.y += dx * 0.01 * timeFactor;
          this.camera.position.y += dy * 0.01 * timeFactor;
        }

        this.updateMapGeometry();

        this.renderer.clear();
        this.camera.lookAt(this.scene.position);
        this.renderer.render(this.scene, this.camera);
      }

      window.requestAnimationFrame(animate);
    }

    animate();
  }

  protected resizeCanvas() {
    let canvas = this.refs["canvas"] as HTMLCanvasElement;
    let rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;

    this.updateAspectRatio();
  }

  protected initializeSampleIndicatorGeometry() {
    let mat = new THREE.ParticleBasicMaterial({
      color: 0xFF00FF,
      size: 0.05
    });

    this.sampleIndicatorGeometry = new THREE.Geometry();
    this.sampleIndicatorGeometry.vertices.push(new THREE.Vector3(0, 0, 0));

    this.sampleIndicatorPoints = new THREE.ParticleSystem(this.sampleIndicatorGeometry, mat);
  }

  protected updateCurrentSample(currentSample: number[] | null) {
    if (!currentSample) {
      this.scatterPlot.remove(this.sampleIndicatorPoints);
      return;
    }

    let vertex = this.sampleIndicatorGeometry.vertices[0];
    [ vertex.x, vertex.y, vertex.z ] = currentSample;

    this.sampleIndicatorGeometry.applyMatrix(
      new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5)
    );

    if (this.scatterPlot.children.indexOf(this.sampleIndicatorPoints) > -1) {
      this.sampleIndicatorGeometry.verticesNeedUpdate = true;
    } else {
      this.scatterPlot.add(this.sampleIndicatorPoints);
    }
  }

  componentWillReceiveProps(props: IProps) {
    if (this.props.datasetRevision !== props.datasetRevision)
      // dataset was updated
      this.updateDatasetGeometry();
    
    if (this.props.modelRevision !== props.modelRevision)
      // model dimensions were updated
      this.initializeMapGeometry();
    
    if (this.props.currentSample !== props.currentSample)
      // update current sample
      this.updateCurrentSample(props.currentSample);

    this.isDirty = true;
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return <canvas ref="canvas" />;
  }
}
