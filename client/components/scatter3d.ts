import * as THREE from "three";

export function scatter3D(
  canvas: HTMLCanvasElement,
  dataset: number[][],
  neurons: number[][]
) {
  var renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas
  });

  var w = canvas.width, h = canvas.height;
  //renderer.setSize(w, h);

  renderer.setClearColor(0xEEEEEE, 1.0);

  var camera = new THREE.PerspectiveCamera(45, w / h, 1, 10000);
  camera.position.z = 2;
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

    var points = new THREE.ParticleSystem(pointGeo, mat);
    scatterPlot.add(points);
  }

  {
    /*
    var mat = new THREE.ParticleBasicMaterial({
      color: 0xff0000,
      size: 0.05
    });

    var pointCount = neurons.length;
    var pointGeo = new THREE.Geometry();
    for (var i = 0; i < pointCount; ++i) {
      let [ x, y, z ] = neurons[i];
      pointGeo.vertices.push(new THREE.Vector3(x, y, z));
    }

    var points = new THREE.ParticleSystem(pointGeo, mat);
    scatterPlot.add(points);
    */

    var lineGeo = new THREE.Geometry();
    neurons
      .map(([ x, y, z ]) => new THREE.Vector3(x, y, z))
      .reduce((a, b) => {
        lineGeo.vertices.push(a, b);
        return b;
      });

    var lineMat = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 4
    });

    var line = new THREE.Line(lineGeo, lineMat);
    scatterPlot.add(line);
  }

  renderer.render(scene, camera);

  var paused = false;
  var last = new Date().getTime();
  var down = false;
  var sx = 0,
      sy = 0;
      
  window.onmousedown = function(ev) {
    down = true;
    sx = ev.clientX;
    sy = ev.clientY;
  };

  window.onmouseup = function() {
    down = false;
  };

  window.onmousemove = function(ev) {
    if (down) {
      var dx = ev.clientX - sx;
      var dy = ev.clientY - sy;
      scatterPlot.rotation.y += dx * 0.01;
      camera.position.y += dy * 0.01;
      sx += dx;
      sy += dy;
    }
  }

  var animating = false;
  window.ondblclick = function() {
    animating = !animating;
  };

  function animate(t: number) {
    if (!paused) {
      last = t;
      /*
      if (animating) {
        var v = pointGeo.vertices;
        for (var i = 0; i < v.length; i++) {
          var u = v[i];
          console.log(u)
          u.angle += u.speed * 0.01;
          u.x = Math.cos(u.angle) * u.radius;
          u.z = Math.sin(u.angle) * u.radius;
        }
        pointGeo.__dirtyVertices = true;
      }*/

      renderer.clear();
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    }

    window.requestAnimationFrame(animate);
  }

  animate(new Date().getTime());

  return renderer.domElement;
}
