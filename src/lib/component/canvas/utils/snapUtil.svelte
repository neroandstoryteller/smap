<script lang="ts">
    import {
        stage,
        layer,
        shapes,
        selectedShape,
        konvaModule,
        transformer,
        isReady,
        editable,
        isDrawingLine,
        genId,
        refreshCanvas,
    } from "$lib/store/canvasStore";
    import { onMount } from "svelte";
    import { Shape, type ShapeConfig } from "konva/lib/Shape";
    import Konva from "konva";
    import { Group } from "konva/lib/Group";

    // 스냅 감지 거리 (픽셀 단위)
    const snapTolerance = 5;
    // 한 줄 정렬 감지 거리 (y 또는 x 차이)
    const lineTolerance = 8;

    function getGroupSize(group: Konva.Group) {
        // Group 내 Shape 노드(사각형 또는 원) 선택
        const shape = group.getChildren(
            (node) => node instanceof Konva.Rect || node instanceof Konva.Circle
        )[0]; // Konva.Rect 또는 Konva.Circle

        if (shape instanceof Konva.Rect) {
            // 사각형인 경우
            const width = shape.width() * shape.scaleX() / 2;
            const height = shape.height() * shape.scaleY() / 2;

            return {
                width: width,
                height: height,
            };
        } else if (shape instanceof Konva.Circle) {
            // 원인 경우
            const radius = shape.radius() * shape.scaleX(); // scaleX와 scaleY는 동일하다고 가정
            return {
                width: radius,
                height: radius,
            };
        }

        // Shape가 없거나 예상치 못한 경우 기본값 반환
        return {
            width: 0,
            height: 0,
        };
    }

    function calcGapX(a: Group, b: Group) {
        let leftShape;
        let rightShape;

        if (a.x() > b.x()) {
            leftShape = b;
            rightShape = a;
        } else {
            leftShape = a;
            rightShape = b;
        }

        const { width: leftShapeWidth, height: leftShapeHeight } = getGroupSize(leftShape);
        const { width: rightShapeWidth, height: rightShapeHeight } = getGroupSize(leftShape);

        const gap = Math.abs(
            leftShape.x() + leftShapeWidth - (rightShape.x() - rightShapeWidth),
        );

        return gap;
    }

    function calcGapY(a: Group, b: Group) {
        let bottomShape;
        let topShape;

        if (a.y() > b.y()) {
            bottomShape = b;
            topShape = a;
        } else {
            bottomShape = a;
            topShape = b;
        }
        const { width: bottomShapeWidth, height: bottomShapeHeight } = getGroupSize(bottomShape);
        const { width: topShapeWidth, height: topShapeHeight } = getGroupSize(topShape);

        const gap = Math.abs(
            bottomShape.y() + bottomShapeHeight - (topShape.y() - topShapeHeight),
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
    function snapPosition(pos: { x: number; y: number }, currentWidth: number, currentHeight: number, currentShape: Group) {
        let newX = pos.x;
        let newY = pos.y;

        $shapes.forEach((otherShape) => {
            if (otherShape === currentShape) return;

            const { width: otherWidth, height: otherHeight } = getGroupSize(otherShape);

            // x 같음
            if (
                Math.abs(pos.x - currentWidth - (otherShape.x() - otherWidth)) <
                snapTolerance
            ) {
                newX = otherShape.x() - otherWidth + currentWidth; // 왼쪽 면 x좌표 같음 스냅
            } else if (
                Math.abs(pos.x + currentWidth - (otherShape.x() + otherWidth)) <
                snapTolerance
            ) {
                newX = otherShape.x() + otherWidth - currentWidth; // 오른쪽 면 x좌표 같음 스냅
            } else if (Math.abs(pos.x - otherShape.x()) < snapTolerance) {
                newX = otherShape.x(); // 센터 스냅

                // x 면 닿음
            } else if (
                Math.abs(pos.x + currentWidth - (otherShape.x() - otherWidth)) <
                snapTolerance
            ) {
                newX = otherShape.x() - otherWidth - currentWidth; // 오른쪽 면 닿음
            } else if (
                Math.abs(pos.x - currentWidth - (otherShape.x() + otherWidth)) <
                snapTolerance
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
        const alignedX = $shapes
            .filter(
                (s) =>
                    s === currentShape ||
                    Math.abs(s.y() - pos.y) < lineTolerance,
            )
            .sort((a, b) => a.x() - b.x());
        // y 스냅 대상: x가 비슷한 도형
        const alignedY = $shapes
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

                    if (leftShape){
                        const { width: leftShapeWidth, height: leftShapeHeight } = getGroupSize(leftShape);
                        if( Math.abs( gap - calcGapWithPos( pos.x, currentWidth, leftShape.x(), leftShapeWidth )) < lineTolerance / 7){
                            newX =
                                leftShape.x() +
                                leftShapeWidth +
                                gap +
                                currentWidth;
                            break;
                        }

                    } 
                    if (rightShape){
                        const { width: rightShapeWidth, height: rightShapeHeight } = getGroupSize(rightShape);
                        if( Math.abs( gap - calcGapWithPos( pos.x, currentWidth, rightShape.x(), rightShapeWidth )) < lineTolerance / 7){
                            newX =
                                rightShape.x() -
                                rightShapeWidth -
                                gap -
                                currentWidth;
                            break;
                        }
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

                    if (bottomShape){
                        const { width: bottomShapeWidth, height: bottomShapeHeight } = getGroupSize(bottomShape);
                        if( Math.abs( gap - calcGapWithPos( pos.y, currentHeight, bottomShape.y(), bottomShapeHeight )) < lineTolerance / 7){
                            newY=
                                bottomShape.y() +
                                bottomShapeHeight +
                                gap +
                                currentHeight;
                            break;
                        }

                    }
                    if (topShape){
                        const { width: topShapeWidth, height: topShapeHeight } = getGroupSize(topShape);
                        if( Math.abs( gap - calcGapWithPos( pos.y, currentHeight, topShape.y(), topShapeHeight )) < lineTolerance / 7){
                            newY =
                                topShape.y() -
                                topShapeHeight -
                                gap -
                                currentHeight;
                            break;
                        }
                    }
                }
            }
        }

        currentShape.position({ x: newX, y: newY });
    }

    // 크기 및 회전 스냅 함수
    function snapRotation(currentShape: Group) {
        let newRotation = currentShape.rotation();

        $shapes.forEach((otherShape) => {
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

    $effect(() => {
        if (!$isReady) return;

        // 모든 shape에 대해 기존 리스너 제거
        $shapes.forEach((shape) => {
            const {width, height} = getGroupSize(shape)
            shape.offsetX(width)
            shape.offsetY(height)

            shape.off("dragmove"); // 기존 dragmove 이벤트 제거
            shape.on("dragmove", () => {
                snapPosition({ x: shape.x(), y: shape.y() },width, height, shape);
            });
        });

        // cleanup 함수: effect가 재실행되거나 컴포넌트가 언마운트될 때 호출
        return () => {
            $shapes.forEach((shape) => {
                shape.off("dragmove"); // 모든 dragmove 이벤트 제거
            });
        };
    });

    onMount(() => {
        const unsubscribe = isReady.subscribe((ready) => {
            if (ready) {
                // Transformer 사용 시 스냅 적용
                $transformer!.on("transform", () => {
                    const activeShape = $transformer!.nodes()[0];
                    if (activeShape && activeShape instanceof Group) {
                        snapRotation(activeShape);
                    }
                });
            }
        });

        return () => {
            unsubscribe();
            // 이벤트 정리
            $transformer!.nodes().forEach((node) => {
                node.off("dragmove");
            });
        };
    });
</script>
