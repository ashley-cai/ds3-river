import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';


			let container, stats;
			let camera, scene, renderer;
			let controls, water, sun, mesh;
			let mousePointer = new THREE.Vector2();
			let raycaster = new THREE.Raycaster();
			let BLOOM_SCENE, bloomLayer, params;
			let darkMaterial, lightMaterial, materials;
			let renderScene, bloomPass, bloomComposer, mixPass, outputPass, finalComposer;
			let glow;
			let hitWaterAudio, ambientWaterAudio, interview1audio, interview2audio, interview3audio, interview4audio;

			init();
			animate();



			function init() {

				container = document.getElementById( 'container' );

				// bloom
				BLOOM_SCENE = 1;
				bloomLayer = new THREE.Layers();
				bloomLayer.set( BLOOM_SCENE );
	
				params = {
					threshold: 0,
					strength: 2,
					radius: 0.5,
					exposure: 1
				};

				lightMaterial = new THREE.MeshBasicMaterial( { color: 'white' } );
				darkMaterial = new THREE.MeshBasicMaterial( { color: 'black' } );
				materials = {};
				//

				renderer = new THREE.WebGLRenderer();
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				// renderer.toneMapping = THREE.ACESFilmicToneMapping;
				renderer.toneMapping = THREE.ReinhardToneMapping;
				renderer.toneMappingExposure = 0.5;
				container.appendChild( renderer.domElement );

				//

				scene = new THREE.Scene();

				camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 500 );
				camera.position.set( 30, 30, 100 );

				//bloom
				renderScene = new RenderPass( scene, camera );

				bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
				bloomPass.threshold = params.threshold;
				bloomPass.strength = params.strength;
				bloomPass.radius = params.radius;

				bloomComposer = new EffectComposer( renderer );
				bloomComposer.renderToScreen = false;
				bloomComposer.addPass( renderScene );
				bloomComposer.addPass( bloomPass );

				mixPass = new ShaderPass(
					new THREE.ShaderMaterial( {
						uniforms: {
							baseTexture: { value: null },
							bloomTexture: { value: bloomComposer.renderTarget2.texture }
						},
						vertexShader: document.getElementById( 'vertexshader' ).textContent,
						fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
						defines: {}
					} ), 'baseTexture'
				);
				mixPass.needsSwap = true;

				outputPass = new OutputPass();

				finalComposer = new EffectComposer( renderer );
				finalComposer.addPass( renderScene );
				finalComposer.addPass( mixPass );
				finalComposer.addPass( outputPass );

				//

				scene.traverse( disposeMaterial );

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
				water.name = "plane";

				scene.add( water );

            // ground

				const groundGeometry = new THREE.PlaneGeometry( 1000, 5000, 1, 1 );
				const groundMaterial = new THREE.MeshBasicMaterial( { color: 0xe7e7e7 } );
				const ground = new THREE.Mesh( groundGeometry, groundMaterial );
				ground.rotation.x = Math.PI / 2;
				ground.name = "plane";
				scene.add( ground );
			
			//depth
                const depthGeometry = new THREE.PlaneGeometry( 1000, 200, 1, 1 );
				const depthMaterial = new THREE.MeshBasicMaterial( { color: 0x828282 } );
				const depth = new THREE.Mesh( depthGeometry, depthMaterial );
				depth.name = "plane";
				depth.position.set(0, -100, 0);
				const textureLoaderdepth = new THREE.TextureLoader();
				textureLoaderdepth.load( 'textures/floors/depth.png', function ( map ) {
					map.colorSpace = THREE.SRGBColorSpace;
					depthMaterial.map = map;
					depthMaterial.needsUpdate = true;
				} );
				scene.add( depth );

			//surface of river
				const surfaceGeometry = new THREE.PlaneGeometry( 1000, 1000, 1, 1 );
				const surfaceMaterial = new THREE.MeshBasicMaterial( { color: 0xe7e7e7 } );
				const surface = new THREE.Mesh( surfaceGeometry, surfaceMaterial );
				surface.name = "plane";
				surface.rotation.x = Math.PI / 2;
				surface.position.set(0, -.1, 0);
				const textureLoader = new THREE.TextureLoader();
				textureLoader.load( 'textures/water/surface.jpg', function ( map ) {
					map.wrapS = THREE.RepeatWrapping;
					map.wrapT = THREE.RepeatWrapping;
					map.anisotropy = 16;
					map.repeat.set( 10, 10 );
					map.colorSpace = THREE.SRGBColorSpace;
					surfaceMaterial.map = map;
					surfaceMaterial.needsUpdate = true;
				} );
				scene.add( surface );

        
        stats = new Stats();
        // container.appendChild( stats.dom );
    
    //ambient light
    const light = new THREE.AmbientLight( 0x686925 ); // soft white light 404040
    light.intensity = 2;
    scene.add( light );

    //import scooter
    const loader = new GLTFLoader();
    loader.load( 'models/scooter.glb', function ( gltf ) {        
		gltf.scene.position.set(30, -95, 90);
		gltf.scene.scale.set(200, 200, 200);
		scene.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
	} );

    //import battery
    loader.load( 'models/battery.glb', function ( gltf ) {
        gltf.scene.position.set(35, -120, 70);
		gltf.scene.scale.set(40, 40, 40);
        scene.add( gltf.scene );
    }, undefined, function ( error ) {
        console.error( error );
	} );

	//import tripod
	loader.load( 'models/tripod.glb', function ( gltf ) {
		gltf.scene.position.set(15, -140, 70);
		gltf.scene.scale.set(40, 40, 40);
		scene.add( gltf.scene );
	}, undefined, function ( error ) {
		console.error( error );
	} );

	//import binderclip
	loader.load( 'models/binderclip.glb', function ( gltf ) {
		gltf.scene.position.set(45, -90, 70);
		gltf.scene.scale.set(40, 40, 40);
		scene.add( gltf.scene );
	}, undefined, function ( error ) {
		console.error( error );
	} );

	//import cone
	loader.load( 'models/cone.glb', function ( gltf ) {
		gltf.scene.position.set(25, -160, 70);
		gltf.scene.scale.set(30, 30, 30);
		scene.add( gltf.scene );
	}, undefined, function ( error ) {
		console.error( error );
	} );

		//import shoppingcart
	loader.load( 'models/shopping-cart.glb', function ( gltf ) {
		gltf.scene.position.set(45, -180, 60);
		gltf.scene.scale.set(30, 30, 30);
		scene.add( gltf.scene );
	}, undefined, function ( error ) {
		console.error( error );
	} );

	//SOUND
	var audioButton = document.getElementById("audio-button");
	var interview1 = "audio/Ella.m4a";
	interview1audio = document.createElement("audio");
	//
	interview1audio.autoplay = true;
	interview1audio.loop = true;
	//
	interview1audio.load();
	interview1audio.src = interview1;
	document.getElementById("audio-container").appendChild(interview1audio);

	var interview2 = "audio/Avalon.m4a";
	interview2audio = document.createElement("audio");
	//
	interview2audio.autoplay = true;
	interview2audio.loop = true;
	//
	interview2audio.load();
	interview2audio.src = interview2;
	document.getElementById("audio-container").appendChild(interview2audio);

	var interview3 = "audio/Henry.m4a";
	interview3audio = document.createElement("audio");
	//
	interview3audio.autoplay = true;
	interview3audio.loop = true;
	//
	interview3audio.load();
	interview3audio.src = interview3;
	document.getElementById("audio-container").appendChild(interview3audio);

	var interview4 = "audio/Julia.m4a";
	interview4audio = document.createElement("audio");
	//
	interview4audio.autoplay = true;
	interview4audio.loop = true;
	//
	interview4audio.load();
	interview4audio.src = interview4;
	document.getElementById("audio-container").appendChild(interview4audio);


	audioButton.addEventListener("click", function(e) {
		interview1audio.play();
		interview2audio.play();
		interview3audio.play();
		interview4audio.play();
		interview1audio.volume = 1;
		interview2audio.volume = 1;
		interview3audio.volume = 1;
		interview4audio.volume = 1;
	})

	var hitWater = "audio/enterwater.mp3";
	hitWaterAudio = document.createElement("audio");
	hitWaterAudio.load();
	hitWaterAudio.src = hitWater;
	document.getElementById("audio-container").appendChild(hitWaterAudio);

	var ambientWater = "audio/ambientwater.mp3";
	ambientWaterAudio = document.createElement("audio");
	//
	ambientWaterAudio.autoplay = true;
	ambientWaterAudio.loop = true;
	//
	ambientWaterAudio.load();
	ambientWaterAudio.src = ambientWater;
	document.getElementById("audio-container").appendChild(ambientWaterAudio);


	window.addEventListener( 'resize', onWindowResize );

	//SCROLL CONTROL
    window.addEventListener("wheel", function(e) {
		depthDisplay();
		depthAudio();
        if (e.deltaY < 0)
        {
		//  console.log('scrolling up');
		 if (camera.position.y < 30) {
         	camera.position.y += .5;
		 }
        }
        else if (e.deltaY > 0)
        {
		//  console.log(camera.position.y)
        //  console.log('scrolling down');
         if (camera.position.y > -175) {
			if (camera.position.y == 0) {
				enterWater();
			}
            camera.position.y -= .5;
        }

        }
      }, true);

	//Add listener to call onMouseMove every time the mouse moves in the browser window
	window.addEventListener('mousemove', onMouseMove);
}

function exitWater(){

}

function enterWater(){
	hitWaterAudio.play();
	ambientWaterAudio.play();
	ambientWaterAudio.volume = 1;
}

function depthAudio(){
	let volume = .3+.003*camera.position.y;
	if (volume < 1 && volume > 0) {
	console.log(volume);
	interview1audio.volume = volume;
	interview2audio.volume = volume;
	interview3audio.volume = volume;
	interview4audio.volume = volume;
	}
}

function depthDisplay() {
	let y = Math.floor(camera.position.y/-7);
	console.log(y);
	if (y >= 0 && y < 25) {
		let depth = document.getElementById("d"+y);
		console.log(depth)
		depth.style.opacity=1;
		let ybefore = y-1;
		let yafter = y+1;

		if (y > 0) {
			document.getElementById("d"+ybefore).style.opacity = 0;
		}
		if (y < 24) {
			document.getElementById("d"+yafter).style.opacity = 0;
		}
	}
}

//A function to be called every time the mouse moves
function onMouseMove(event) {
		mousePointer = getMouseVector2(event, window);

		const getFirstValue = true;

		const intersections = checkRayIntersections(mousePointer, camera, raycaster, scene, getFirstValue);

		let objects = getHoveredObjects(intersections);

		//glow object
		objects.forEach((object) => {
			if (object.name != "plane") {
				object.layers.enable(BLOOM_SCENE);
			}
			glow = object;
		});
		scene.traverse(deselect);
		//deselect
		render();
}

function deselect(obj) {
	if (obj!= glow) {
		obj.layers.disable(BLOOM_SCENE);
	} 
}

export function getHoveredObjects(objectList){
    const cardObjects = [];

    //If it's not an array return the value
    if(!Array.isArray(objectList)){
        const objectName = objectList.object.name || "Unnamed Object";
        cardObjects.push(objectList.object);
        return cardObjects;
    }

    objectList.forEach((object) => {
        const objectName = object.object.name || "Unnamed Object";
	        cardObjects.push(object.object);
    });

    return cardObjects;
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

	bloomComposer.setSize( width, height );
	finalComposer.setSize( width, height );

	render();
}

function animate() {

    requestAnimationFrame( animate );
    render();
    stats.update();

}

function render() {

    const time = performance.now() * 0.001;
    water.material.uniforms[ 'time' ].value += 1.0 / 60.0;

	scene.traverse( darkenNonBloomed );
	bloomComposer.render();
	scene.traverse( restoreMaterial );

	finalComposer.render();

    // renderer.render( scene, camera );

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

function darkenNonBloomed( obj ) {

	if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {

		materials[ obj.uuid ] = obj.material;
		obj.material = darkMaterial;

	}

}

function restoreMaterial( obj ) {
	if ( materials[ obj.uuid ] ) {
		obj.material = materials[ obj.uuid ];
		delete materials[ obj.uuid ];
	}

}

function disposeMaterial( obj ) {
	if ( obj.material ) {
		obj.material.dispose();

	}

}