import Konva from "konva";

const WIDTH = 1200;
const HEIGHT = 600;

const addNumbersOnLayer = (layer) => {
	const numberOffset = 10;
	const gridSpacing = 50;
	const pointSize = 3;

	// Drawing numbers on x-axis
	for (let i = 0; i <= WIDTH / gridSpacing; i++) {
		const value = i - WIDTH / (2 * gridSpacing);
		if (value !== 0) {
			const numberText = new Konva.Text({
				text: value.toString(),
				x: i * gridSpacing - 5,
				y: HEIGHT / 2 + numberOffset,
				fontSize: 12,
				fill: "black",
			});
			layer.add(numberText);

			const point = new Konva.Line({
				points: [
					i * gridSpacing,
					HEIGHT / 2 - pointSize,
					i * gridSpacing,
					HEIGHT / 2 + pointSize,
				],
				stroke: "black",
				strokeWidth: 1,
			});
			layer.add(point);
		}
	}

	// Drawing numbers on y-axis
	for (let i = 0; i <= HEIGHT / gridSpacing; i++) {
		const value = HEIGHT / (2 * gridSpacing) - i;
		if (value !== 0) {
			const numberText = new Konva.Text({
				text: value.toString(),
				x: WIDTH / 2 - (numberOffset + 10),
				y: i * gridSpacing - 5,
				fontSize: 12,
				fill: "black",
			});
			layer.add(numberText);

			const point = new Konva.Line({
				points: [
					WIDTH / 2 - pointSize,
					i * gridSpacing,
					WIDTH / 2 + pointSize,
					i * gridSpacing,
				],
				stroke: "black",
				strokeWidth: 1,
			});
			layer.add(point);
		}
	}

	layer.draw();
};

const addAxesToLayer = (layer) => {
	const labels = [
		{ text: "+x", x: WIDTH - 20, y: HEIGHT / 2 - 25 },
		{ text: "-x", x: WIDTH / 120, y: HEIGHT / 2 - 25 },
		{ text: "+y", x: WIDTH / 2 + 25, y: HEIGHT / 60 },
		{ text: "-y", x: WIDTH / 2 + 25, y: HEIGHT - 20 },
	];

	const xAxis = new Konva.Line({
		points: [0, HEIGHT / 2, WIDTH, HEIGHT / 2],
		stroke: "black",
		strokeWidth: 1,
	});

	const yAxis = new Konva.Line({
		points: [WIDTH / 2, 0, WIDTH / 2, HEIGHT],
		stroke: "black",
		strokeWidth: 1,
	});

	labels.forEach((label) => {
		const text = new Konva.Text({
			x: label.x,
			y: label.y,
			text: label.text,
			fontSize: 12,
			fill: "black",
		});
		layer.add(text);
	});
	layer.add(xAxis, yAxis);
};

const addGridToLayer = (layer, spacing) => {
	// Vertical lines
	for (let x = spacing; x < WIDTH; x += spacing) {
		const line = new Konva.Line({
			points: [x, 0, x, HEIGHT],
			stroke: "lightgray",
			strokeWidth: 1,
		});
		layer.add(line);
	}

	// Horizontal lines
	for (let y = spacing; y < HEIGHT; y += spacing) {
		const line = new Konva.Line({
			points: [0, y, WIDTH, y],
			stroke: "lightgray",
			strokeWidth: 1,
		});
		layer.add(line);
	}
};

const addObjectsToLayer = (objectsLayer) => {
	const focalPrimePoint = new Konva.Circle({
		name: "focal-prime-point",
		draggable: true,
		x: WIDTH / 2 - 50,
		y: HEIGHT / 2,
		radius: 5,
		fill: "red",
		opacity: 1,
		dragBoundFunc: function (pos) {
			const padding = 5;
			const newX = Math.min(WIDTH - padding, Math.max(padding, pos.x));
			const newY = this.getAbsolutePosition().y;
			return {
				x: newX,
				y: newY,
			};
		},
		hitFunc: function (context) {
			context.beginPath();
			context.arc(0, 0, 10, 0, Math.PI * 2);
			context.closePath();
			context.fillStrokeShape(this);
		},
	});

	const focalPoint = new Konva.Circle({
		name: "focal-point",
		draggable: false,
		x: WIDTH / 2 + 50,
		y: HEIGHT / 2,
		radius: 5,
		fill: "lightgreen",
		opacity: 1,
	});

	const realObjectHeightPoint = new Konva.Circle({
		name: "real-object-height-point",
		draggable: true,
		x: 500,
		y: 250,
		radius: 5,
		fill: "black",
		opacity: 1,
		dragBoundFunc: function (pos) {
			const padding = 0;
			const newX = Math.min(
				WIDTH - this.radius() - padding,
				Math.max(this.radius() + padding, pos.x)
			);
			const newY = Math.min(
				HEIGHT - this.radius() - padding,
				Math.max(this.radius() + padding, pos.y)
			);
			return {
				x: newX,
				y: newY,
			};
		},
	});

	let { magnifiedImageObjectDistance, imageObjectHeight, isConvexLens } =
		calculateMagnification(realObjectHeightPoint, focalPoint);

	const imageObjectHeightPoint = new Konva.Circle({
		name: "image-object-height-point",
		draggable: false,
		x:
			realObjectHeightPoint.x() < WIDTH / 2
				? WIDTH / 2 - magnifiedImageObjectDistance
				: WIDTH / 2 + magnifiedImageObjectDistance,
		y:
			realObjectHeightPoint.y() < HEIGHT / 2
				? HEIGHT / 2 - imageObjectHeight
				: HEIGHT / 2 + imageObjectHeight,
		radius: 5,
		fill: "black",
		opacity: 0.7,
		visible: true,
	});

	const realObject = new Konva.Circle({
		name: "real-object",
		draggable: false,
		x: realObjectHeightPoint.x(),
		y: HEIGHT / 2,
		radius: 3,
		fill: "black",
		opacity: 1,
	});

	const imageObject = new Konva.Circle({
		name: "image-object",
		draggable: false,
		x: imageObjectHeightPoint.x(),
		y: HEIGHT / 2,
		radius: 3,
		fill: "black",
		opacity: 1,
		visible: true,
	});

	const focalLinePoints = [
		realObjectHeightPoint.x(),
		realObjectHeightPoint.y(),
		WIDTH / 2,
		realObjectHeightPoint.y(),
		realObjectHeightPoint.x() < WIDTH / 2
			? focalPoint.x()
			: focalPrimePoint.x(),
		realObjectHeightPoint.x() < WIDTH / 2
			? focalPoint.y()
			: focalPrimePoint.y(),
		imageObjectHeightPoint.x(),
		imageObjectHeightPoint.y(),
	];

	const focalLine = new Konva.Line({
		name: "focal-line",
		points: focalLinePoints,
		stroke: "lightgreen",
		strokeWidth: 1,
	});

	const imageLinePoints = [
		realObjectHeightPoint.x(),
		realObjectHeightPoint.y(),
		WIDTH / 2,
		HEIGHT / 2,
		imageObjectHeightPoint.x(),
		imageObjectHeightPoint.y(),
	];
	const imageLine = new Konva.Line({
		name: "image-line",
		points: imageLinePoints,
		stroke: "black",
		strokeWidth: 1,
	});

	const focalPrimeLinePoints = [
		realObjectHeightPoint.x(),
		realObjectHeightPoint.y(),
		realObjectHeightPoint.x() < WIDTH / 2
			? focalPrimePoint.x()
			: focalPoint.x(),
		realObjectHeightPoint.x() < WIDTH / 2
			? focalPrimePoint.y()
			: focalPoint.y(),
		WIDTH / 2,
		imageObjectHeightPoint.y(),
		imageObjectHeightPoint.x(),
		imageObjectHeightPoint.y(),
	];
	const focalPrimeLine = new Konva.Line({
		name: "focal-prime-line",
		points: focalPrimeLinePoints,
		stroke: "red",
		strokeWidth: 1,
	});

	extendLines([focalLine, imageLine, focalPrimeLine], WIDTH, HEIGHT);

	const realObjectLabel = new Konva.Text({
		x: realObject.x() + 10,
		y: realObject.y() - 10,
		text: "Object",
		fontSize: 11,
		fill: "black",
	});

	const updatePoints = () => {
		focalLine.points([
			realObjectHeightPoint.x(),
			realObjectHeightPoint.y(),
			WIDTH / 2,
			realObjectHeightPoint.y(),
			realObjectHeightPoint.x() < WIDTH / 2
				? focalPoint.x()
				: focalPrimePoint.x(),
			realObjectHeightPoint.x() < WIDTH / 2
				? focalPoint.y()
				: focalPrimePoint.y(),
			imageObjectHeightPoint.x(),
			imageObjectHeightPoint.y(),
		]);

		imageLine.points([
			realObjectHeightPoint.x(),
			realObjectHeightPoint.y(),
			WIDTH / 2,
			HEIGHT / 2,
			imageObjectHeightPoint.x(),
			imageObjectHeightPoint.y(),
		]);

		focalPrimeLine.points([
			realObjectHeightPoint.x(),
			realObjectHeightPoint.y(),
			realObjectHeightPoint.x() < WIDTH / 2
				? focalPrimePoint.x()
				: focalPoint.x(),
			realObjectHeightPoint.x() < WIDTH / 2
				? focalPrimePoint.y()
				: focalPoint.y(),
			WIDTH / 2,
			imageObjectHeightPoint.y(),
			imageObjectHeightPoint.x(),
			imageObjectHeightPoint.y(),
		]);

		extendLines([focalLine, imageLine, focalPrimeLine], WIDTH, HEIGHT);
	};
	const handleRealObjectHeightPointMove = () => {
		const isAtCenter = realObjectHeightPoint.x() === WIDTH / 2;
		const isAtFocalPrime = realObjectHeightPoint.x() === focalPrimePoint.x();
		const isAtFocal = realObjectHeightPoint.x() === focalPoint.x();

		imageObject.show();
		imageObjectHeightPoint.show();
		focalLine.show();
		imageLine.show();
		focalPrimeLine.show();

		const gridSpacing = 50;
		const snapDistance = 3;

		const closestIntersect = {
			x: Math.round(realObjectHeightPoint.x() / gridSpacing) * gridSpacing,
			y: Math.round(realObjectHeightPoint.y() / gridSpacing) * gridSpacing,
		};
		const distanceToClosestPoint = Math.sqrt(
			(realObjectHeightPoint.x() - closestIntersect.x) ** 2 +
				(realObjectHeightPoint.y() - closestIntersect.y) ** 2
		);
		if (distanceToClosestPoint < snapDistance) {
			realObjectHeightPoint.position(closestIntersect);
		}

		if (isAtCenter) {
			// Hide all lines
			focalLine.hide();
			imageLine.hide();
			focalPrimeLine.hide();
		} else {
			const focalLength = WIDTH / 2 - focalPrimePoint.x();
			const focalPointX = WIDTH / 2 + focalLength;
			focalPoint.position({ x: focalPointX, y: focalPoint.y() });

			const { magnifiedImageObjectDistance, imageObjectHeight, isConvexLens } =
				calculateMagnification(realObjectHeightPoint, focalPoint);
			imageObjectHeightPoint.position({
				x:
					realObjectHeightPoint.x() < WIDTH / 2
						? WIDTH / 2 - magnifiedImageObjectDistance
						: WIDTH / 2 + magnifiedImageObjectDistance,
				y:
					realObjectHeightPoint.y() < HEIGHT / 2
						? HEIGHT / 2 - imageObjectHeight
						: HEIGHT / 2 + imageObjectHeight,
			});

			realObject.position({ x: realObjectHeightPoint.x(), y: HEIGHT / 2 });
			imageObject.position({ x: imageObjectHeightPoint.x(), y: HEIGHT / 2 });

			updatePoints();

			// Hide lines based on position
			if (isConvexLens && isAtFocalPrime) {
				imageObjectHeightPoint.hide();
				imageObject.hide();
				focalPrimeLine.hide();
				focalLine.points([
					realObjectHeightPoint.x(),
					realObjectHeightPoint.y(),
					WIDTH / 2,
					realObjectHeightPoint.y(),
					focalPoint.x(),
					focalPoint.y(),
				]);
				imageLine.points([
					realObjectHeightPoint.x(),
					realObjectHeightPoint.y(),
					WIDTH / 2,
					HEIGHT / 2,
				]);
				extendLines([focalLine, imageLine], WIDTH, HEIGHT);
			} else if (isConvexLens && isAtFocal) {
				imageObjectHeightPoint.hide();
				imageObject.hide();
				focalPrimeLine.hide();
				focalLine.points([
					realObjectHeightPoint.x(),
					realObjectHeightPoint.y(),
					WIDTH / 2,
					realObjectHeightPoint.y(),
					focalPrimePoint.x(),
					focalPrimePoint.y(),
				]);
				imageLine.points([
					realObjectHeightPoint.x(),
					realObjectHeightPoint.y(),
					WIDTH / 2,
					HEIGHT / 2,
				]);
				extendLines([focalLine, imageLine], WIDTH, HEIGHT);
			}
		}
	};

	const handleFocalPrimePointMove = () => {
		const isAtCenter = realObjectHeightPoint.x() === WIDTH / 2;
		const isAtFocalPrime = realObjectHeightPoint.x() === focalPrimePoint.x();
		const isAtFocal = realObjectHeightPoint.x() === focalPoint.x();
		const gridSpacing = 50;
		const snapDistance = 3;

		imageObject.show();
		imageObjectHeightPoint.show();
		focalLine.show();
		imageLine.show();
		focalPrimeLine.show();

		const focalLength = WIDTH / 2 - focalPrimePoint.x();
		const focalPointX = WIDTH / 2 + focalLength;
		focalPoint.position({ x: focalPointX, y: focalPoint.y() });

		const closestIntersect = {
			x: Math.round(focalPrimePoint.x() / gridSpacing) * gridSpacing,
			y: Math.round(focalPrimePoint.y() / gridSpacing) * gridSpacing,
		};
		const distanceToClosestPoint = Math.sqrt(
			(focalPrimePoint.x() - closestIntersect.x) ** 2 +
				(focalPrimePoint.y() - closestIntersect.y) ** 2
		);
		if (distanceToClosestPoint < snapDistance) {
			focalPrimePoint.position(closestIntersect);
		}
		if (isAtCenter) {
			// Hide all lines
			focalLine.hide();
			imageLine.hide();
			focalPrimeLine.hide();
		} else {
			const focalLength = WIDTH / 2 - focalPrimePoint.x();
			const focalPointX = WIDTH / 2 + focalLength;
			focalPoint.position({ x: focalPointX, y: focalPoint.y() });

			const { magnifiedImageObjectDistance, imageObjectHeight } =
				calculateMagnification(realObjectHeightPoint, focalPoint, isConvexLens);
			imageObjectHeightPoint.position({
				x:
					realObjectHeightPoint.x() < WIDTH / 2
						? WIDTH / 2 - magnifiedImageObjectDistance
						: WIDTH / 2 + magnifiedImageObjectDistance,
				y:
					realObjectHeightPoint.y() < HEIGHT / 2
						? HEIGHT / 2 - imageObjectHeight
						: HEIGHT / 2 + imageObjectHeight,
			});

			realObject.position({ x: realObjectHeightPoint.x(), y: HEIGHT / 2 });
			imageObject.position({ x: imageObjectHeightPoint.x(), y: HEIGHT / 2 });

			updatePoints();
			// Hide lines based on position
			// FIX: bug
			if (isConvexLens && isAtFocalPrime) {
				imageObjectHeightPoint.hide();
				imageObject.hide();
				focalPrimeLine.hide();
				focalLine.points([
					realObjectHeightPoint.x(),
					realObjectHeightPoint.y(),
					WIDTH / 2,
					realObjectHeightPoint.y(),
					focalPoint.x(),
					focalPoint.y(),
				]);
				imageLine.points([
					realObjectHeightPoint.x(),
					realObjectHeightPoint.y(),
					WIDTH / 2,
					HEIGHT / 2,
				]);
				extendLines([focalLine, imageLine], WIDTH, HEIGHT);
				// FIX: bug
			} else if (isConvexLens && isAtFocal) {
				imageObjectHeightPoint.hide();
				imageObject.hide();
				focalPrimeLine.hide();
				focalLine.points([
					realObjectHeightPoint.x(),
					realObjectHeightPoint.y(),
					WIDTH / 2,
					realObjectHeightPoint.y(),
					focalPrimePoint.x(),
					focalPrimePoint.y(),
				]);
				imageLine.points([
					realObjectHeightPoint.x(),
					realObjectHeightPoint.y(),
					WIDTH / 2,
					HEIGHT / 2,
				]);
				extendLines([focalLine, imageLine], WIDTH, HEIGHT);
			}
		}
	};

	realObjectHeightPoint.on("dragmove", handleRealObjectHeightPointMove);
	realObjectHeightPoint.on("dragend", handleRealObjectHeightPointMove);
	focalPrimePoint.on("dragmove", handleFocalPrimePointMove);
	focalPrimePoint.on("dragend", handleFocalPrimePointMove);

	objectsLayer.add(
		realObject,
		realObjectLabel,
		imageObject,
		focalPoint,
		focalPrimePoint,
		realObjectHeightPoint,
		imageObjectHeightPoint,
		focalLine,
		imageLine,
		focalPrimeLine
	);
	objectsLayer.batchDraw();
};

const calculateMagnification = (realObjectHeightPoint, focalPoint) => {
	const isConvexLens = focalPoint.x() >= WIDTH / 2;
	const focalPointDistance = isConvexLens
		? Math.abs(focalPoint.x() - WIDTH / 2)
		: -Math.abs(focalPoint.x() - WIDTH / 2);
	const realObjectDistance = Math.abs(realObjectHeightPoint.x() - WIDTH / 2);
	const realObjectHeight = Math.abs(realObjectHeightPoint.y() - HEIGHT / 2);

	let imageObjectDistance =
		1 / (1 / focalPointDistance - 1 / realObjectDistance);
	let magnifier = -imageObjectDistance / realObjectDistance;

	if (!isFinite(imageObjectDistance)) {
		imageObjectDistance = 0;
	}
	if (!isFinite(magnifier)) {
		magnifier = 0;
	}

	const magnifiedImageObjectDistance = realObjectDistance * magnifier;
	const imageObjectHeight = realObjectHeight * magnifier;
	return { magnifiedImageObjectDistance, imageObjectHeight, isConvexLens };
};

const extendLineToCanvasEdge = (points, canvasWidth, canvasHeight) => {
	const [x1, y1, x2, y2] = points.slice(-4);
	const slope = (y2 - y1) / (x2 - x1);
	let x = 0,
		y = 0;

	if (x1 === x2) {
		x = x1;
		y = y2 < y1 ? 0 : canvasHeight;
	} else if (y1 === y2) {
		x = x2 < x1 ? 0 : canvasWidth;
		y = y1;
	} else {
		if (x2 > x1) {
			x = canvasWidth;
			y = y1 + slope * (canvasWidth - x1);
		} else {
			x = 0;
			y = y1 - slope * x1;
		}
	}

	return [...points, x, y];
};

const extendLines = (lines, canvasWidth, canvasHeight) => {
	lines.forEach((line) => {
		const points = line.points();
		const extendedPoints = extendLineToCanvasEdge(
			points,
			canvasWidth,
			canvasHeight
		);
		line.points(extendedPoints);
	});
};

const createCanvasAndLayers = () => {
	const stage = new Konva.Stage({
		container: "container",
		width: WIDTH,
		height: HEIGHT,
	});

	const axesLayer = new Konva.Layer({});
	const objectsLayer = new Konva.Layer({});

	stage.add(axesLayer, objectsLayer);
	addGridToLayer(axesLayer, 50);
	addObjectsToLayer(objectsLayer);
	addAxesToLayer(axesLayer);
	addNumbersOnLayer(axesLayer);
};

const runKonva = () => {
	createCanvasAndLayers();
};

window.onload = () => {
	runKonva();
};
