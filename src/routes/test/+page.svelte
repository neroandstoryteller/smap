<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

	let canvas: HTMLCanvasElement;
	let mixer: THREE.AnimationMixer | null = null;
	let clips: THREE.AnimationClip[] = [];
	const activeActions: { [name: string]: THREE.AnimationAction } = {};

	onMount(() => {
		// 1. Scene Setup
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0xdddddd);

		// 2. Camera
		const camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		camera.position.set(0, 2, 10); // 카메라를 더 뒤로 이동

		// 3. Renderer
		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.outputColorSpace = THREE.SRGBColorSpace; // 최신 Three.js 버전에 맞게 수정

		// 4. Lighting
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(5, 10, 7.5);
		scene.add(directionalLight);

		// 5. Controls
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;

		// 6. Model Loader
		const loader = new GLTFLoader();
		loader.load(
			'/3d_models/glados/scene.gltf',
			(gltf) => {
				const model = gltf.scene;

				// --- 모델의 크기와 위치를 자동으로 조정 ---
				const box = new THREE.Box3().setFromObject(model);
				const size = box.getSize(new THREE.Vector3());
				const center = box.getCenter(new THREE.Vector3());

				const maxSize = Math.max(size.x, size.y, size.z);
				const desiredSize = 4; // 모델이 보일 원하는 크기
				const scale = desiredSize / maxSize;

				model.scale.set(scale, scale, scale);
				model.position.sub(center.multiplyScalar(scale));
				// --- 자동 조정 로직 끝 ---

				scene.add(model);
				
				// Set up animation mixer
				mixer = new THREE.AnimationMixer(model);
				clips = gltf.animations;
			},
			undefined,
			(error) => {
				console.error('An error happened while loading the model:', error);
			}
		);
		
		// Animation Loop
		const clock = new THREE.Clock();
		const animate = () => {
			requestAnimationFrame(animate);
			const delta = clock.getDelta();

			if (mixer) {
				mixer.update(delta);
			}

			controls.update();
			renderer.render(scene, camera);
		};
		animate();

		// Handle window resizing
		const handleResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};
		window.addEventListener('resize', handleResize);

		// Cleanup
		return () => {
			window.removeEventListener('resize', handleResize);
			renderer.dispose();
		};
	});

	function toggleAnimation(name: string) {
		if (!mixer) return;

		const currentAction = activeActions[name];

		// Stop all other animations before playing a new one
		for (const actionName in activeActions) {
			if (actionName !== name) {
				activeActions[actionName].stop();
				delete activeActions[actionName];
			}
		}

		if (currentAction) {
			// If the clicked animation was already playing, just stop it.
			currentAction.stop();
			delete activeActions[name];
		} else {
			// If it's a new animation, play it.
			const clip = THREE.AnimationClip.findByName(clips, name);
			if (clip) {
				const action = mixer.clipAction(clip);
				action.reset().play();
				activeActions[name] = action;
			}
		}

		// Svelte가 UI를 업데이트하도록 강제
		clips = [...clips];
	}
</script>

<div class="container">
	<canvas bind:this={canvas} />
	<div class="controls">
		{#each clips as clip}
			<button on:click={() => toggleAnimation(clip.name)} class:active={!!activeActions[clip.name]}>
				{clip.name}
			</button>
		{/each}
	</div>
</div>

<style>
	.container {
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}

	canvas {
		display: block;
	}

	.controls {
		position: absolute;
		top: 20px;
		left: 20px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		z-index: 10;
	}

	button {
		padding: 10px 15px;
		font-size: 14px;
		background-color: #4CAF50;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		text-align: left;
	}

	button:hover {
		background-color: #45a049;
	}

	button.active {
		background-color: #f44336;
	}
</style>