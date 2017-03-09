import * as React from "react";
import * as THREE from "three";

import Dataset from "../../som/Dataset";
import Model from "../../som/Model";


export function scatter3D(
  canvas: HTMLCanvasElement,
  dataset: Dataset,
  model: Model
) {
  var ref = {
    animating: false,
    needsRender: true,
    needsResize: false,
  };

  var renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas
  });
 
  renderer.setClearColor(0xEEEEEE, 1.0);

  var camera = new THREE.PerspectiveCamera(30, 1, 1, 10000);
  camera.position.z = 3;
  camera.position.x = -1;
  camera.position.y = 1;

  function resize() {
    var w = canvas.width, h = canvas.height;
    
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);

    canvas.style.width = "";
    canvas.style.height = "";
  }

  resize();

  var scene = new THREE.Scene();

  var scatterPlot = new THREE.Object3D();
  scene.add(scatterPlot);

  scatterPlot.rotation.y = 0;

  function v(x: number, y: number, z: number) {
    return new THREE.Vector3(x, y, z);
  }

  { // build coordinate system
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

    var lineGeo = new THREE.Geometry();
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

    var lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,
      linewidth: 2
    });

    var line = new THREE.Line(lineGeo, lineMat, THREE.LinePieces);
    scatterPlot.add(line);
  }

  {
    var mat = new THREE.ParticleBasicMaterial({
      color: 0x222222,
      size: 0.01
    });
    
    var pointCount = dataset.sampleCount;
    var pointGeo = new THREE.Geometry();
    for (var i = 0; i < pointCount; ++i) {
      let [ x, y, z ] = dataset.getSample(i);
      pointGeo.vertices.push(new THREE.Vector3(x, y, z));
    }

    pointGeo.applyMatrix(
      new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5)
    );

    var points = new THREE.ParticleSystem(pointGeo, mat);
    scatterPlot.add(points);
  }

  var weightsToVectors = new Map<number, Set<THREE.Vector3>>();
  var lineGeo = new THREE.Geometry();

  {
    for (let i = 0; i < model.neuronCount; ++i) {
      if (!weightsToVectors.has(i))
        weightsToVectors.set(i, new Set<THREE.Vector3>());
      
      for (let j = 0; j < model.neuronCount; ++j) {
        if (!weightsToVectors.has(j))
          weightsToVectors.set(j, new Set<THREE.Vector3>());

        if (model.distanceMatrix.get(i, j) <= 1) {
          let iW = model.weightMatrix.getRow(i);
          let jW = model.weightMatrix.getRow(j);

          let iWT = new THREE.Vector3(iW[0], iW[1], iW[2]);
          let jWT = new THREE.Vector3(jW[0], jW[1], jW[2]);

          weightsToVectors.get(i)!.add(iWT);
          weightsToVectors.get(j)!.add(jWT);

          lineGeo.vertices.push(
            iWT,
            jWT
          );
        }
      };
    };

    var lineMat = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 4
    });

    lineGeo.applyMatrix(
      new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5)
    );

    var line = new THREE.LineSegments(lineGeo, lineMat);
    scatterPlot.add(line);
  }

  renderer.render(scene, camera);

  var down = false;
  var sx = 0,
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

      scatterPlot.rotation.y += dx * timeFactor * 0.01;
      camera.position.y += dy * timeFactor * 0.01;

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
  function animate() {
    let t = new Date().getTime();
    let deltaT = t - lastT;
    lastT = t;

    if (ref.needsResize) {
      resize();
      
      ref.needsResize = false;
      ref.needsRender = true;
    }

    if (
      ref.needsRender ||
      down ||
      Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1 ||
      ref.animating
    ) {
      ref.needsRender = false;

      if (!down) {
        let timeFactor = deltaT / 1000 * 60;

        dx *= Math.pow(0.99, timeFactor);
        dy *= Math.pow(0.95, timeFactor);
        scatterPlot.rotation.y += dx * 0.01 * timeFactor;
        camera.position.y += dy * 0.01 * timeFactor;
      }

      [ ...weightsToVectors ].forEach(([ neuronIndex, tvs ]) => {
        let weights = model.weightMatrix.getRow(neuronIndex);
        tvs.forEach(tv => {
          tv.x = weights[0] - 0.5;
          tv.y = weights[1] - 0.5;
          tv.z = weights[2] - 0.5;
        });
      });

      //if (ref.animating)
        lineGeo.verticesNeedUpdate = true;

      renderer.clear();
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    }

    window.requestAnimationFrame(animate);
  }

  animate();

  return ref;
}

export interface IProps {
  dataset: Dataset;
  model: Model;
  animating: boolean;
}

export default class ScatterPlot extends React.Component<IProps, void> {
  protected renderElement: HTMLCanvasElement;
  protected ref: any;

  componentDidMount() {
    this.ref = scatter3D(
      this.refs["canvas"] as any,
      this.props.dataset,
      this.props.model
    );

    let resizeTimeout: any;
    window.addEventListener("resize", e => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        console.log("resize");
        this.resizeCanvas();
      }, 500);
    });

    this.resizeCanvas();
  }

  protected resizeCanvas() {
    let canvas = this.refs["canvas"] as HTMLCanvasElement;
    let rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;

    this.ref.needsResize = true;
  }

  componentWillReceiveProps(props: IProps) {
    this.ref.animating = props.animating;
    this.ref.needsRender = true;
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return <canvas ref="canvas" />;
  }
}
