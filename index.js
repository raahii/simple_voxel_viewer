var THREE = require('three')
var OrbitControls = require('three-orbit-controls')(THREE)
var $ = require("jquery");
var fs = require('fs');

var renderer, scene, camera, grid, voxel
var grid_size = 64
var cube_size = 10
var origin = {
  x: -0.5*cube_size*(grid_size-1),
  y: cube_size / 2,
  z: -0.5*cube_size*(grid_size-1),
}

init()

function read_binvox(filename) {
}

function plot_cube(x, y, z) {
  var g = new THREE.BoxGeometry(cube_size, cube_size, cube_size);
  var m = new THREE.MeshPhongMaterial({color: 0x65C87A});
  var box = new THREE.Mesh(g, m)
  _x = origin.x + cube_size * x
  _y = origin.y + cube_size * y
  _z = origin.z + cube_size * z
  box.position.set(_x, _y, _z)
  scene.add(box);
}

function plot_voxel() {
  for (var i=0; i<grid_size; i++){
    for (var j=0; j<grid_size; j++){
      for (var k=0; k<grid_size; k++){
        if (voxel[i][j][k] == true) {
          plot_cube(i, k, j)
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
  var width  = $('.container').width()
  var height = $('.container').height()
  renderer.setSize(width, height)
  renderer.setClearColor( new THREE.Color(0xffffff),0.0);
  $('.container').append(renderer.domElement)

  // シーン
  scene = new THREE.Scene();

  // カメラ
  camera = new THREE.PerspectiveCamera( 40, width / height, 1, 10000 )
  camera.position.set(700, 1200, 1000);
  camera.lookAt(new THREE.Vector3(0, 0, 0))
  controls = new OrbitControls(camera)

  // 光源
  var ambientLight = new THREE.AmbientLight( 0x606060 )
  scene.add( ambientLight )
  var directionalLight = new THREE.DirectionalLight( 0xffffff );
  directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
  scene.add( directionalLight );

  // グリッド
  grid = new THREE.GridHelper(grid_size*cube_size, grid_size)
  grid.material.color = new THREE.Color(0x000000);
  grid.material.opacity= 0.2;
  scene.add(grid)

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
