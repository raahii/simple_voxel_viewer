var THREE = require('three');
// var fs = window.require('fs');
var fs = require('browserify-fs');
var OrbitControls = require('three-orbit-controls')(THREE);
var $ = require("jquery");

var renderer, scene, camera, grid, voxel=[];
var grid_size = 64; var cube_size = 10;
var origin = {
  x: -0.5*cube_size*(grid_size-1),
  y: cube_size / 2,
  z: -0.5*cube_size*(grid_size-1),
};

function read_binvox(filename) {
  fs.readFile('./models/model_normalized.solid.binvox', function(err, buf) {
    if (err) throw err;
    
    // read header
    var lines = [], line;
    while (line != 'data') {
      var pos = buf.indexOf('\n');
      line = buf.toString('utf-8', 0, pos);
      lines.push(line);
      buf = buf.slice(pos+1);
    }
    
    console.log("...reading binvox version");
    var line = lines[0].slice(0, 7);
    if (line != '#binvox') {
      console.error(`Error: first line reads ${line} instead of #binvox`);
      return -1;
    }
    var version = parseInt(lines[0].slice(8), 10);
    
    process.stdout.write('...reading depth(x), width(z), height(y) : ');
    var depth, height, width;
    for(var i=1; i<lines.length-1; i++) {
      line = lines[i];
      if (line.slice(0, line.indexOf(' ')) == 'dim') {
        line = line.slice(line.indexOf(' ')+1);
        var pos = line.indexOf(' ');
        depth = parseInt(line.slice(0, pos), 10);

        line = line.slice(pos+1);
        pos = line.indexOf(' ');
        height = parseInt(line.slice(0, pos), 10);

        line = line.slice(pos+1);
        width = parseInt(line, 10);
        break;

      } else {
        console.warn(`...unrecognized keyword ${line}, skipping`);
      }
    }
    if (depth === void 0) {
      if (height === void 0 || width === void 0) {
        console.error("error reading header");
      } else {
        console.error("missing dimensions in header");
      }
      return -1;
    }
    console.log(`(${depth}, ${width}, ${height})`);
    
    // read voxel data
    data = [];
    for ( var i=0; i<buf.byteLength/2; i++) {
      value = buf.readUInt8(2*i) == 1;
      data.push(value);
    }
    console.log(data);

    // reshape to voxel
    voxel = [];
    for (var i=0; i<width; i++){
      voxel.push([]);
      for (var j=0; j<depth; j++){
        voxel[i].push([]);
        for (var k=0; k<height; k++){
          var v = data.shift();
          if (v === void 0) {
            voxel[i][j].push(v);
          } else {
            voxel[i][j].push(false);
          }
        }
      }
    }

    return new Promise(function(resolce, reject) {
      resolve();
    });
  })
}

function plot_cube(x, y, z) {
  var g = new THREE.BoxGeometry(cube_size, cube_size, cube_size);
  var m = new THREE.MeshPhongMaterial({color: 0x65C87A});
  var box = new THREE.Mesh(g, m);
  _x = origin.x + cube_size * x;
  _y = origin.y + cube_size * y;
  _z = origin.z + cube_size * z;
  box.position.set(_x, _y, _z);
  scene.add(box);
}

function plot_voxel() {
  console.info(voxel);
  for (var i=0; i<grid_size; i++){
    for (var j=0; j<grid_size; j++){
      for (var k=0; k<grid_size; k++){
        if (voxel[i][j][k] == true) {
          plot_cube(i, k, j);
        }
      }
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function init() {
  // レンダラー
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias:true});
  var width  = $('.container').width();
  var height = $('.container').height();
  renderer.setSize(width, height);
  renderer.setClearColor( new THREE.Color(0xffffff),0.0);
  $('.container').append(renderer.domElement);

  // シーン
  scene = new THREE.Scene();

  // カメラ
  camera = new THREE.PerspectiveCamera( 40, width / height, 1, 10000 );
  camera.position.set(700, 1200, 1000);
  camera.lookAt(new THREE.Vector3(0, 32, 0));
  controls = new OrbitControls(camera);

  // 光源
  var ambientLight = new THREE.AmbientLight( 0x606060 );
  scene.add( ambientLight );
  var directionalLight = new THREE.DirectionalLight( 0xffffff );
  directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
  scene.add( directionalLight );

  // グリッド
  grid = new THREE.GridHelper(grid_size*cube_size, grid_size);
  grid.material.color = new THREE.Color(0x000000);
  grid.material.opacity= 0.2;
  scene.add(grid);

  // ボクセル
  voxel = [];
  for (var i=0; i<grid_size; i++){
    voxel.push([])
    for (var j=0; j<grid_size; j++){
      voxel[i].push([])
      for (var k=0; k<grid_size; k++){
        voxel[i][j].push(false)
      }
    }
  }

  voxel[0][0][0] = true
  voxel[32][32][32] = true
  voxel[63][63][0] = true

  plot_voxel()

  // 初回実行
  animate();
}

init();
