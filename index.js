import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

			let container, stats;
			let camera, scene, renderer;
			let controls, water, sun, mesh;
			let scooter;
			let mousePointer = new THREE.Vector2();
			let raycaster = new THREE.Raycaster();

			init();
			animate();

			function init() {

				container = document.getElementById( 'container' );

				//

				renderer = new THREE.WebGLRenderer();
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				renderer.toneMapping = THREE.ACESFilmicToneMapping;
				renderer.toneMappingExposure = 0.5;
				container.appendChild( renderer.domElement );

				//

				scene = new THREE.Scene();

				camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 500 );
				camera.position.set( 30, 30, 100 );

				//

				sun = new THREE.Vector3();

				// Water

				const waterGeometry = new THREE.PlaneGeometry( 1000, 1000 );

				water = new Water(
					waterGeometry,
					{
						textureWidth: 512,
						textureHeight: 512,
						waterNormals: new THREE.TextureLoader().load( 'textures/water/waternormals.jpg', function ( texture ) {

							texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

						} ),
						sunDirection: new THREE.Vector3(),
						sunColor: 0xffffff,
						waterColor: 0x001e0f,
						distortionScale: 3.7,
						fog: scene.fog !== undefined
					}
				);

				water.rotation.x = - Math.PI / 2;

				scene.add( water );

            // ground

				const groundGeometry = new THREE.PlaneGeometry( 1000, 1000, 1, 1 );
				const groundMaterial = new THREE.MeshBasicMaterial( { color: 0xe7e7e7 } );
				const ground = new THREE.Mesh( groundGeometry, groundMaterial );
				ground.rotation.x = Math.PI / 2;
				scene.add( ground );
			
			//depth
                const depthGeometry = new THREE.PlaneGeometry( 1000, 1000, 1, 1 );
				const depthMaterial = new THREE.MeshBasicMaterial( { color: 0x3F3F3F } );
				const depth = new THREE.Mesh( depthGeometry, depthMaterial );
				depth.position.set(0, 0, -50);
				scene.add( depth );

				// const textureLoader = new THREE.TextureLoader();
				// textureLoader.load( 'textures/floors/FloorsCheckerboard_S_Diffuse.jpg', function ( map ) {

				// 	map.wrapS = THREE.RepeatWrapping;
				// 	map.wrapT = THREE.RepeatWrapping;
				// 	map.anisotropy = 16;
				// 	map.repeat.set( 4, 4 );
				// 	map.colorSpace = THREE.SRGBColorSpace;
				// 	groundMaterial.map = map;
				// 	groundMaterial.needsUpdate = true;

				// } );
        
        stats = new Stats();
        container.appendChild( stats.dom );
    
    //ambient light
    const light = new THREE.AmbientLight( 0x404040 ); // soft white light
    light.intensity = 50;
    scene.add( light );

    //import scooter
    const loader = new GLTFLoader();
    loader.load( 'models/scooter.glb', function ( gltf ) {
		scooter = gltf;
        gltf.scene.position.set(30, -100, 80);
		gltf.scene.scale.set(15, 15, 15);
        scene.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
	} );

	window.addEventListener( 'resize', onWindowResize );

    window.addEventListener("wheel", function(e) {
        if (e.deltaY < 0)
        {
         console.log('scrolling up');
		 if (camera.position.y < 30) {
         	camera.position.y += .5;
		 }
        }
        else if (e.deltaY > 0)
        {
         console.log('scrolling down');
         if (camera.position.y > -100) {
            camera.position.y -= .5;
        }
        }
      }, true);

	//Add listener to call onMouseMove every time the mouse moves in the browser window
	window.addEventListener('mousemove', onMouseMove);
}

//A function to be called every time the mouse moves
function onMouseMove(event) {
		mousePointer = getMouseVector2(event, window);

		const getFirstValue = true;

		const intersections = checkRayIntersections(mousePointer, camera, raycaster, scene, getFirstValue);

		intersections.forEach((object) => {
			console.log(object);
			object.scene.scale.set(30,30,30);
			scene.add( object.scene );
		});
}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );
    render();
    stats.update();

}

function render() {

    const time = performance.now() * 0.001;
    water.material.uniforms[ 'time' ].value += 1.0 / 60.0;

    renderer.render( scene, camera );

}

function getMouseVector2(event, window){
    let mousePointer = new THREE.Vector2()

    mousePointer.x = (event.clientX / window.innerWidth) * 2 - 1;
	mousePointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    return mousePointer;
}

function checkRayIntersections(mousePointer, camera, raycaster, scene, getFirstValue) {
    raycaster.setFromCamera(mousePointer, camera);

    let intersections = raycaster.intersectObjects(scene.children, true);
    
    intersections = getFirstValue ? intersections[0] : intersections;

    return intersections;
}