var THREE = require('three')
var controls = require('orbit-controls')()
var $ = require("jquery");

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias:true});
var width = $('.container').width()
var height = $('.container').height()
renderer.setSize(width, height)
renderer.setClearColor( new THREE.Color(0xffffff),0.0);
$('.container').append(renderer.domElement)

// シーン
const scene = new THREE.Scene();

// カメラ
camera = new THREE.PerspectiveCamera( 40, width / height, 1, 10000 )
camera.position.set(0, 500, 600);
camera.lookAt(new THREE.Vector3(0, 0, 0))

// 箱
start = -165
for(var i=0; i<10; i++) {
  g = new THREE.BoxGeometry(10, 10, 10);
  m = new THREE.MeshPhongMaterial({color: 0x65C87A});
  box = new THREE.Mesh(g, m);
  box.position.set(start+i*20, 0, 0)
  scene.add(box);
}

// グリッド
var grid = new THREE.GridHelper(640, 64)
grid.material.color = new THREE.Color(0x000000);
grid.material.opacity= 0.2;
scene.add(grid)

// 光源
var ambientLight = new THREE.AmbientLight( 0x606060 )
scene.add( ambientLight )

var directionalLight = new THREE.DirectionalLight( 0xffffff );
directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
scene.add( directionalLight );

// 初回実行
controls.enable()
animate();

function animate() {
  requestAnimationFrame(animate);
 
  // 箱を回転させる
  box.rotation.x += 0.01;
  box.rotation.y += 0.01;
  
  // orbit control
  controls.update()
  controls.copyInto(camera.position, camera.direction, camera.up)
  
  // レンダリング
  renderer.render(scene, camera);
}
