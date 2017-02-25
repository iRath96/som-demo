import * as THREE from "three";
import { Vector3D } from "./Vector";

export function scatter3D(
  canvas: HTMLCanvasElement,
  dataset: number[][],
  neurons: {
    weights: Vector3D,
    position: number[]
  }[]
) {
  var ref = {
    animating: false
  };

  var renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas
  });

  var w = canvas.width, h = canvas.height;
  //renderer.setSize(w, h);

  renderer.setClearColor(0xEEEEEE, 1.0);

  var camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
  camera.position.z = 3;
  camera.position.x = -1;
  camera.position.y = 1;

  var scene = new THREE.Scene();

  var scatterPlot = new THREE.Object3D();
  scene.add(scatterPlot);

  scatterPlot.rotation.y = 0;

  function v(x: number, y: number, z: number) {
    return new THREE.Vector3(x, y, z);
  }

  const vpts = {
    xMin: 0, xMax: 1,
    yMin: 0, yMax: 1,
    zMin: 0, zMax: 1
  }

  var lineGeo = new THREE.Geometry();
  lineGeo.vertices.push(
    v(vpts.xMin, vpts.yMin, vpts.zMin), v(vpts.xMax, vpts.yMin, vpts.zMin),
    v(vpts.xMin, vpts.yMin, vpts.zMin), v(vpts.xMin, vpts.yMax, vpts.zMin),
    v(vpts.xMin, vpts.yMin, vpts.zMin), v(vpts.xMin, vpts.yMin, vpts.zMax)
  );

  lineGeo.applyMatrix(
    new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5)
  );

  var lineMat = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 2
  });

  var line = new THREE.Line(lineGeo, lineMat);
  scatterPlot.add(line);

  {
    var mat = new THREE.ParticleBasicMaterial({
      color: 0x222222,
      size: 0.01
    });
    
    var pointCount = dataset.length;
    var pointGeo = new THREE.Geometry();
    for (var i = 0; i < pointCount; ++i) {
      let [ x, y, z ] = dataset[i];
      pointGeo.vertices.push(new THREE.Vector3(x, y, z));
    }

    pointGeo.applyMatrix(
      new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5)
    );

    var points = new THREE.ParticleSystem(pointGeo, mat);
    scatterPlot.add(points);
  }

  var weightsToVectors = new Map<Vector3D, Set<THREE.Vector3>>();
  var lineGeo = new THREE.Geometry();

  {
    neurons.forEach(a => {
      if (!weightsToVectors.has(a.weights))
        weightsToVectors.set(a.weights, new Set<THREE.Vector3>());
      
      neurons.forEach(b => {
        if (!weightsToVectors.has(b.weights))
          weightsToVectors.set(b.weights, new Set<THREE.Vector3>());

        let valid = a.position
          .map((v, i) => b.position[i] - v)
          .reduce((valid: boolean | null, v) => {
            if (valid === false) return false;
            if (v === 0) return valid;
            if (v !== 1) return false;
            return valid === null;
          }, null);
        
        if (valid) {
          let aWT = new THREE.Vector3(a.weights.x, a.weights.y, a.weights.z);
          let bWT = new THREE.Vector3(b.weights.x, b.weights.y, b.weights.z);

          weightsToVectors.get(a.weights)!.add(aWT);
          weightsToVectors.get(b.weights)!.add(bWT);

          lineGeo.vertices.push(
            aWT,
            bWT
          );
        }
      });
    });

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

  canvas.onmouseup = () => {
    down = false;
  };

  let dx: number = 0, dy: number = 0;
  canvas.onmousemove = ev => {
    if (down) {
      dx = ev.clientX - sx;
      dy = ev.clientY - sy;
      scatterPlot.rotation.y += dx * 0.01;
      camera.position.y += dy * 0.01;
      sx += dx;
      sy += dy;
    }
  }

  let needsRender = true;
  function animate(t: number) {
    if (
      needsRender ||
      down ||
      Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1 ||
      ref.animating
    ) {
      needsRender = false;

      if (!down) {
        dx *= 0.99;
        dy *= 0.95;
        scatterPlot.rotation.y += dx * 0.01;
        camera.position.y += dy * 0.01;
      }

      [ ...weightsToVectors ].forEach(([ weight, tvs ]) => {
        tvs.forEach(tv => {
          tv.x = weight.x - 0.5;
          tv.y = weight.y - 0.5;
          tv.z = weight.z - 0.5;
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

  animate(new Date().getTime());

  return ref;
}
