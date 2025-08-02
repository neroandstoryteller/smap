<script lang="ts">
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import Konva from "konva";
	import { Shape, type ShapeConfig } from "konva/lib/Shape";

	let canvasContainer: HTMLDivElement;

	onMount(() => {
		if (!browser) return;

		// Konva Stage 생성
		const stage = new Konva.Stage({
			container: canvasContainer,
			listening: true,
			width: 1000,
			height: 1000,
		});

		// Layer 생성
		const layer = new Konva.Layer();
		stage.add(layer);

		// 여러 오브젝트 생성 (파란, 녹색, 빨간, 노란 직사각형)
		const rect1 = new Konva.Rect({
			x: 100,
			y: 100,
			width: 200,
			height: 100,
			fill: "blue",
			draggable: true,
			offsetX: 100, // 회전 중심 고정
			offsetY: 50,
		});

		const rect2 = new Konva.Rect({
			x: 350,
			y: 100,
			width: 200,
			height: 100,
			fill: "green",
			draggable: true,
			offsetX: 100,
			offsetY: 50,
		});

		const rect3 = new Konva.Rect({
			x: 600,
			y: 100,
			width: 200,
			height: 100,
			fill: "red",
			draggable: true,
			offsetX: 100,
			offsetY: 50,
		});

		const rect4 = new Konva.Rect({
			x: 100,
			y: 400,
			width: 250,
			height: 120,
			fill: "yellow",
			draggable: true,
			offsetX: 125,
			offsetY: 60,
		});

		// 추가 도형 (크기 다름, 다양한 위치)
		const rect5 = new Konva.Rect({
			x: 200,
			y: 300,
			width: 150,
			height: 80,
			fill: "purple",
			draggable: true,
			offsetX: 75,
			offsetY: 40,
		});

		const rect6 = new Konva.Rect({
			x: 500,
			y: 500,
			width: 300,
			height: 200,
			fill: "orange",
			draggable: true,
			offsetX: 150,
			offsetY: 100,
		});

		const rect7 = new Konva.Rect({
			x: 700,
			y: 100,
			width: 100,
			height: 50,
			fill: "pink",
			draggable: true,
			offsetX: 50,
			offsetY: 25,
		});

		const rect8 = new Konva.Rect({
			x: 100,
			y: 600,
			width: 400,
			height: 150,
			fill: "brown",
			draggable: true,
			offsetX: 200,
			offsetY: 75,
		});

		// Layer에 추가
		layer.add(rect1);
		layer.add(rect2);
		layer.add(rect3);
		layer.add(rect4);

		// Transformer 생성
		const transformer = new Konva.Transformer({
			rotateEnabled: true,
			borderStroke: "#000",
			anchorFill: "#fff",
			anchorStroke: "#000",
			anchorSize: 10,
			keepRatio: false,
			rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315], // 회전 각도 스냅
			centeredScaling: false, // 중심 기반 크기 조절
			boundBoxFunc: (oldBox, newBox) => {
				if (newBox.width < 20 || newBox.height < 20) {
					return oldBox;
				}
				return newBox;
			},
		});
		layer.add(transformer);

		// 스냅 감지 거리 (픽셀 단위)
		const snapTolerance = 10;
		// 한 줄 정렬 감지 거리 (y 또는 x 차이)
		const lineTolerance = 100;

		// 모든 도형 목록
		const shapes: Shape<ShapeConfig>[] = [rect1, rect2, rect3, rect4];

		// 도형 클릭 시 Transformer 활성화
		shapes.forEach((shape) => {
			shape.on("click", () => {
				transformer.nodes([shape]);
				layer.draw();
			});
		});

		// Stage 클릭 시 Transformer 비활성화
		stage.on("click", (e) => {
			if (e.target === stage) {
				transformer.nodes([]);
				layer.draw();
			}
		});

		function calcGapX(a: Shape, b: Shape) {
			let leftShape;
			let rightShape;

			if (a.x() > b.x()) {
				leftShape = b;
				rightShape = a;
			} else {
				leftShape = a;
				rightShape = b;
			}
			const leftShapeWidth = (leftShape.width() * leftShape.scaleX()) / 2;
			const rightShapeWidth =
				(rightShape.width() * rightShape.scaleX()) / 2;

			const gap = Math.abs(
				leftShape.x() +
					leftShapeWidth -
					(rightShape.x() - rightShapeWidth),
			);

			return gap;
		}

		function calcGapY(a: Shape, b: Shape) {
			let bottomShape;
			let topShape;

			if (a.y() > b.y()) {
				bottomShape = b;
				topShape = a;
			} else {
				bottomShape = a;
				topShape = b;
			}
			const bottomShapeWidth =
				(bottomShape.height() * bottomShape.scaleY()) / 2;
			const topShapeWidth = (topShape.height() * topShape.scaleY()) / 2;

			const gap = Math.abs(
				bottomShape.y() +
					bottomShapeWidth -
					(topShape.y() - topShapeWidth),
			);

			return gap;
		}

		function calcGapWithPos(
			aPos: number,
			aLength: number,
			bPos: number,
			bLength: number,
		) {
			if (aPos > bPos) {
				return Math.abs(bPos + bLength - (aPos - aLength));
			} else {
				return Math.abs(aPos + aLength - (bPos - bLength));
			}
		}

		// 위치 스냅 함수 (드래그 시 사용)
		function snapPosition(
			pos: { x: number; y: number },
			currentShape: Shape<ShapeConfig>,
		) {

			let newX = pos.x;
			let newY = pos.y;
			const currentWidth =
				(currentShape.width() * currentShape.scaleX()) / 2;
			const currentHeight =
				(currentShape.height() * currentShape.scaleY()) / 2;

			shapes.forEach((otherShape) => {
				if (otherShape === currentShape) return;

				const otherWidth =
					(otherShape.width() * otherShape.scaleX()) / 2;
				const otherHeight =
					(otherShape.height() * otherShape.scaleY()) / 2;

				// x 같음
				if (
					Math.abs(
						pos.x - currentWidth - (otherShape.x() - otherWidth),
					) < snapTolerance
				) {
					newX = otherShape.x() - otherWidth + currentWidth; // 왼쪽 면 x좌표 같음 스냅
					console.log("왼쪽 면 x좌표 같음 스냅")
				} else if (
					Math.abs(
						pos.x + currentWidth - (otherShape.x() + otherWidth),
					) < snapTolerance
				) {
					newX = otherShape.x() + otherWidth - currentWidth; // 오른쪽 면 x좌표 같음 스냅
					console.log("오른쪽 면 x좌표 같음 스냅")
				} else if (Math.abs(pos.x - otherShape.x()) < snapTolerance) {
					newX = otherShape.x(); // 센터 스냅
					console.log("x좌표 센터 스냅")
					// x 면 닿음
				} else if (
					Math.abs(
						pos.x + currentWidth - (otherShape.x() - otherWidth),
					) < snapTolerance
				) {
					newX = otherShape.x() - otherWidth - currentWidth; // 오른쪽 면 닿음
				} else if (
					Math.abs(
						pos.x - currentWidth - (otherShape.x() + otherWidth),
					) < snapTolerance
				) {
					newX = otherShape.x() + otherWidth + currentWidth; // 왼쪽 면 닿음
				}

				// y 같음
				if (
					Math.abs(
						pos.y - currentHeight - (otherShape.y() - otherHeight),
					) < snapTolerance
				) {
					newY = otherShape.y() - otherHeight + currentHeight; // 위쪽 면 y좌표 같음 스냅
				} else if (
					Math.abs(
						pos.y + currentHeight - (otherShape.y() + otherHeight),
					) < snapTolerance
				) {
					newY = otherShape.y() + otherHeight - currentHeight; // 아래쪽 면 y좌표 같음 스냅
				} else if (Math.abs(pos.y - otherShape.y()) < snapTolerance) {
					newY = otherShape.y(); // 센터 스냅

					// y 면 닿음
				} else if (
					Math.abs(
						pos.y + currentHeight - (otherShape.y() - otherHeight),
					) < snapTolerance
				) {
					newY = otherShape.y() - otherHeight - currentHeight; // 위쪽 면 닿음
				} else if (
					Math.abs(
						pos.y - currentHeight - (otherShape.y() + otherHeight),
					) < snapTolerance
				) {
					newY = otherShape.y() + otherHeight + currentHeight; // 아래쪽 면 닿음
				}
			});

			// 간격 스냅 (x축: 3개 이상의 오브젝트, 한 줄로 정렬)
			// x 스냅 대상: y가 비슷한 도형 (한 줄로 간주)
			const alignedX = shapes
				.filter(
					(s) =>
						s === currentShape ||
						Math.abs(s.y() - pos.y) < lineTolerance,
				)
				.sort((a, b) => a.x() - b.x());
			// y 스냅 대상: x가 비슷한 도형
			const alignedY = shapes
				.filter(
					(s) =>
						s === currentShape ||
						Math.abs(s.x() - pos.x) < lineTolerance,
				)
				.sort((a, b) => a.y() - b.y());

			if (alignedX.length >= 3) {
				const indexOfCurrentShape: number =
					alignedX.indexOf(currentShape);
				const leftShape = alignedX[indexOfCurrentShape - 1];
				const rightShape = alignedX[indexOfCurrentShape + 1];

				for (let i = 0; i < alignedX.length - 1; i++) {
					if (
						i !== indexOfCurrentShape &&
						i + 1 !== indexOfCurrentShape
					) {
						const gap = calcGapX(alignedX[i], alignedX[i + 1]);

						if (
							leftShape &&
							Math.abs(
								gap -
									calcGapWithPos(
										pos.x,
										currentWidth,
										leftShape.x(),
										leftShape.width() / 2,
									),
							) <
								lineTolerance / 10
						) {
							newX =
								leftShape.x() +
								leftShape.width() / 2 +
								gap +
								currentWidth;
							break;
						} else if (
							rightShape &&
							Math.abs(
								gap -
									calcGapWithPos(
										pos.x,
										currentWidth,
										rightShape.x(),
										rightShape.width() / 2,
									),
							) <
								lineTolerance / 10
						) {
							newX =
								rightShape.x() -
								rightShape.width() / 2 -
								gap -
								currentWidth;
							break;
						}
					}
				}
			}

			if (alignedY.length >= 3) {
				const indexOfCurrentShape: number =
					alignedY.indexOf(currentShape);
				const bottomShape = alignedY[indexOfCurrentShape - 1];
				const topShape = alignedY[indexOfCurrentShape + 1];

				for (let i = 0; i < alignedY.length - 1; i++) {
					if (
						i !== indexOfCurrentShape &&
						i + 1 !== indexOfCurrentShape
					) {
						const gap = calcGapY(alignedY[i], alignedY[i + 1]);

						if (
							bottomShape &&
							Math.abs(
								gap -
									calcGapWithPos(
										pos.y,
										currentHeight,
										bottomShape.y(),
										bottomShape.height() / 2,
									),
							) <
								lineTolerance / 10
						) {
							newY =
								bottomShape.y() +
								bottomShape.height() / 2 +
								gap +
								currentHeight;
							break;
						} else if (
							topShape &&
							Math.abs(
								gap -
									calcGapWithPos(
										pos.y,
										currentHeight,
										topShape.y(),
										topShape.height() / 2,
									),
							) <
								lineTolerance / 10
						) {
							newY =
								topShape.y() -
								topShape.height() / 2 -
								gap -
								currentHeight;
							break;
						}
					}
				}
			}

			return { x: newX, y: newY };
		}

		// 크기 및 회전 스냅 함수
		function snapSizeAndRotation(currentShape: Shape<ShapeConfig>) {
			let newRotation = currentShape.rotation();

			shapes.forEach((otherShape) => {
				if (otherShape === currentShape) return;

				// 회전 스냅 (다른 도형의 회전 각도에 맞춤)
				const otherRotation = otherShape.rotation();
				if (Math.abs(newRotation - otherRotation) < snapTolerance) {
					newRotation = otherRotation;
				}
			});

			// 회전 적용 (위치 영향 없도록)
			currentShape.rotation(newRotation);
		}

		// 드래그 시 스냅 적용
		shapes.forEach((shape) => {
			shape.dragBoundFunc((pos) => snapPosition(pos, shape));
		});

		// Transformer 사용 시 스냅 적용
		transformer.on("transform", () => {
			const activeShape = transformer.nodes()[0];
			if (activeShape && activeShape instanceof Konva.Shape) {
				// 크기와 회전 스냅만 적용 (위치 스냅 제외)
				snapSizeAndRotation(activeShape);
				layer.draw();
			}
		});

		// 초기 렌더링
		layer.draw();

		// 정리 함수
		return () => {
			stage.destroy();
		};
	});
</script>

{#if browser}
	<div class="canvas-container" bind:this={canvasContainer}></div>
{/if}

<style>
	.canvas-container {
		width: 1000px;
		height: 1000px;
		border: 1px solid black;
		position: relative;
	}
</style>
