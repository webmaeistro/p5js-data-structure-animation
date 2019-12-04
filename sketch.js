/* eslint-disable */

// Title: Data Structures
//thanx fal

// CAUTION: Spaghetti code! (Redundant codes & inconsistent use of Array and Set)


"use strict";
//
// ------------ Circular area -----------------------------
//  Depends on: Physics body
//
class CircularArea {
    constructor(position, radius) {
        this.centerPosition = position;
        this.radius = radius;
    }
    overlap(body) {
        const distance = body.position.dist(this.centerPosition);
        const bodyRadius = 0.5 * body.bodySize;
        if (distance + bodyRadius <= this.radius)
            return 1;
        if (distance >= this.radius + bodyRadius)
            return -1;
        return 0;
    }
    setBodyOnCircumference(body, offsetDistance) {
        const directionAngle = atan2(body.y - this.centerPosition.y, body.x - this.centerPosition.x);
        const distance = this.radius + offsetDistance;
        body.position.set(this.centerPosition.x + distance * cos(directionAngle), this.centerPosition.y + distance * sin(directionAngle));
    }
    keepIn(body, restitution = 1) {
        if (this.overlap(body) === 1)
            return;
        this.setBodyOnCircumference(body, -0.5 * body.bodySize);
        const normalUnitVector = p5.Vector.sub(this.centerPosition, body.position).normalize();
        body.kinematicQuantity.bounce(normalUnitVector, restitution);
    }
    keepOut(body, restitution = 1) {
        if (this.overlap(body) === -1)
            return;
        this.setBodyOnCircumference(body, +0.5 * body.bodySize);
        const normalUnitVector = p5.Vector.sub(body.position, this.centerPosition).normalize();
        body.kinematicQuantity.bounce(normalUnitVector, restitution);
    }
}
//
// ------------ Collection utility (functions for Array, Set) -----------------------
//
function getRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}
function popRandom(array) {
    return array.splice(Math.floor(Math.random() * array.length), 1)[0];
}
function roundRobin(set, callback) {
    const array = Array.from(set);
    const arrayLength = array.length;
    for (let i = 0, len = arrayLength - 1; i < len; i += 1) {
        for (let k = i + 1, kLen = arrayLength; k < kLen; k += 1) {
            callback(array[i], array[k]);
        }
    }
}
//
// ------------ Data structure visualizer -----------------------------
//
class DataStructureVisualizer {
    setBodyVelocity(body, targetX, targetY, durationFrameCount) {
        const t = durationFrameCount;
        body.setVelocity((targetX - body.x) / t, (targetY - body.y) / t - 0.5 * this.gravityConstant * t);
    }
    constructor(x, y, name) {
        this.isRemoved = false;
        this.gravityConstant = 500 * unitSpeed / IDEAL_FRAME_RATE;
        this.position = createVector(x, y);
        this.name = name;
    }
    draw() {
        translate(this.position.x, this.position.y);
        this.drawAnimation();
        this.drawName();
        translate(-this.position.x, -this.position.y);
    }
    drawName() {
        noStroke();
        fill(0);
        text(this.name, 0, 120 * unitLength);
    }
}
// ------------ Stack -----------
class StackVisualizer extends DataStructureVisualizer {
    constructor(x, y) {
        super(x, y, 'Stack');
        this.elementStack = SpriteArray.create();
        this.pushingElementArray = SpriteArray.create();
        this.poppingElementArray = SpriteArray.create();
        this.nextElementTargetPosition = createVector();
        this.elementIntervalLength = 20 * unitLength;
        this.stackLimitLength = 10;
        this.pushDurationFrameCount = 0.5 * IDEAL_FRAME_RATE;
    }
    step() {
        this.pushingElementArray.step();
        this.poppingElementArray.step();
        this.updatePushingElements();
        this.updatePoppingElements();
        if (frameCount % Math.floor(0.25 * IDEAL_FRAME_RATE) === 0) {
            if (this.isPushable()) {
                if (Math.random() < (1 - this.elementStack.length / this.stackLimitLength)) {
                    this.push();
                }
            }
            if (this.isPoppable()) {
                this.pop();
            }
        }
    }
    drawAnimation() {
        translate(0, 60 * unitLength);
        this.elementStack.draw();
        this.pushingElementArray.draw();
        this.poppingElementArray.draw();
        translate(0, -60 * unitLength);
    }
    push() {
        const pushingElement = new VisualDataElement();
        const x = random(-100, -20) * unitLength;
        const y = random(-200, -100) * unitLength;
        const targetX = 0;
        const targetY = this.nextElementTargetPosition.y;
        const t = this.pushDurationFrameCount;
        pushingElement.body.setPosition(x, y);
        this.setBodyVelocity(pushingElement.body, targetX, targetY, t);
        pushingElement.body.bodySize = 14 * unitLength;
        pushingElement.beginAppear(0.5 * IDEAL_FRAME_RATE);
        this.pushingElementArray.push(pushingElement);
        this.nextElementTargetPosition.sub(0, this.elementIntervalLength);
    }
    pop() {
        const poppingElement = this.elementStack.pop();
        if (!poppingElement)
            return;
        const speed = random(100, 200) * unitSpeed;
        const directionAngle = -QUARTER_PI + random(-0.5 * QUARTER_PI, 0.5 * QUARTER_PI);
        poppingElement.body.setVelocity(speed * cos(directionAngle), speed * sin(directionAngle));
        poppingElement.beginDisappear(0.5 * IDEAL_FRAME_RATE);
        this.poppingElementArray.push(poppingElement);
        this.nextElementTargetPosition.add(0, this.elementIntervalLength);
    }
    isPushable() {
        return (this.pushingElementArray.length + this.elementStack.length) < this.stackLimitLength;
    }
    isPoppable() {
        return this.elementStack.length > 0 && this.pushingElementArray.length === 0;
    }
    updatePushingElements() {
        if (this.pushingElementArray.length === 0)
            return;
        const targetElementPositionY = this.elementStack.length > 0 ?
            this.elementStack[this.elementStack.length - 1].body.y - this.elementIntervalLength : 0;
        for (let i = this.pushingElementArray.length - 1; i >= 0; i -= 1) {
            const pushingElement = this.pushingElementArray[i];
            pushingElement.body.accelerate(0, this.gravityConstant);
            if (pushingElement.properFrameCount >= this.pushDurationFrameCount) {
                pushingElement.body.setPosition(0, targetElementPositionY);
                this.pushingElementArray.splice(i, 1);
                this.elementStack.push(pushingElement);
            }
        }
    }
    updatePoppingElements() {
        if (this.poppingElementArray.length === 0)
            return;
        for (let i = this.poppingElementArray.length - 1; i >= 0; i -= 1) {
            this.poppingElementArray[i].body.accelerate(0, this.gravityConstant);
        }
    }
}
// ------------ Table -----------
class TableVisualizer extends DataStructureVisualizer {
    constructor(x, y) {
        super(x, y, 'Table');
        this.elementArray = SpriteArray.create();
        this.tupleArray = SpriteArray.create();
        this.deletingTupleArray = SpriteArray.create();
        this.tupleArrayLimitLength = 6;
        this.tupleIntervalLength = 32 * unitLength;
        this.insertDurationFrameCount = 0.5 * IDEAL_FRAME_RATE;
        this.tupleFieldCount = 5;
        this.elementIntervalLength = 24 * unitLength;
        this.elementSize = 12 * unitLength;
        this.tupleCreatingPositionX = 0 * unitLength;
        this.tupleCreatingOffsetPositionXArray = [];
        for (let i = 0; i < this.tupleFieldCount; i += 1) {
            const x = (-0.5 * (this.tupleFieldCount - 1) + i) * this.elementIntervalLength;
            this.tupleCreatingOffsetPositionXArray.push(x);
        }
        this.tupleCreatingPositionY = 80 * unitLength;
        this.tupleTopRelativePositionY = -170 * unitLength;
        this.tupleFrameShapeColor = new NoFillShapeColor(color(160));
        this.tupleFrameDrawBodyShape = (body) => {
            rectMode(CENTER);
            for (let i = 0; i < this.tupleFieldCount; i += 1) {
                const offsetX = this.tupleCreatingOffsetPositionXArray[i];
                rect(body.x + offsetX, body.y, this.elementIntervalLength, this.elementIntervalLength);
            }
            rectMode(CORNER);
        };
        const header = new VisualDataElement();
        header.body.setPosition(0, this.tupleCreatingPositionY + this.tupleTopRelativePositionY - 0.7 * this.tupleIntervalLength);
        header.shapeColor = new ShapeColor(color(160), color(160, 32));
        header.drawBodyShape = (body) => {
            rectMode(CENTER);
            for (let i = 0; i < this.tupleFieldCount; i += 1) {
                const offsetX = this.tupleCreatingOffsetPositionXArray[i];
                rect(body.x + offsetX, body.y, this.elementIntervalLength, 0.3 * this.elementIntervalLength);
            }
            rectMode(CORNER);
        };
        this.headerElement = header;
    }
    step() {
        this.elementArray.step();
        this.tupleArray.step();
        this.deletingTupleArray.step();
        this.updateElements();
        this.updateTuples();
        if (frameCount % Math.floor(0.25 * IDEAL_FRAME_RATE) === 0) {
            if (this.isInsertable()) {
                if (Math.random() < (1 - this.tupleArray.length / this.tupleArrayLimitLength)) {
                    this.insert();
                }
            }
            if (this.isDeletable()) {
                this.delete();
            }
        }
    }
    drawAnimation() {
        this.headerElement.draw();
        this.elementArray.draw();
        this.tupleArray.draw();
        this.deletingTupleArray.draw();
    }
    updateElements() {
        for (let i = this.elementArray.length - 1; i >= 0; i -= 1) {
            const eachElement = this.elementArray[i];
            const spriteArray = eachElement.getAllLeafElements();
            for (const eachSprite of spriteArray) {
                eachSprite.body.accelerate(0, this.gravityConstant);
            }
            if (eachElement.properFrameCount >= this.insertDurationFrameCount) {
                for (let i = 0; i < this.tupleFieldCount; i += 1) {
                    spriteArray[i].body.setPosition(this.tupleCreatingOffsetPositionXArray[i], this.tupleCreatingPositionY);
                    spriteArray[i].body.setVelocity(0, 0);
                }
                const frameSprite = new VisualDataElement();
                frameSprite.body.setPosition(this.tupleCreatingPositionX, this.tupleCreatingPositionY);
                frameSprite.shapeColor = this.tupleFrameShapeColor;
                frameSprite.drawBodyShape = this.tupleFrameDrawBodyShape;
                eachElement.add(frameSprite);
                eachElement.isMovable = true;
                this.tupleArray.push(this.elementArray.splice(i, 1)[0]);
            }
        }
    }
    updateTuples() {
        for (let i = this.tupleArray.length - 1; i >= 0; i -= 1) {
            const tuplePosition = this.tupleArray[i].kinematicQuantity.position;
            const tupleVelocity = this.tupleArray[i].kinematicQuantity.velocity;
            const targetY = (i === 0) ? this.tupleTopRelativePositionY :
                this.tupleArray[i - 1].kinematicQuantity.position.y + this.tupleIntervalLength;
            tupleVelocity.y = 0.1 * (targetY - tuplePosition.y);
        }
    }
    insert() {
        const compositeElement = new CompositeVisualDataElement();
        const targetY = this.tupleCreatingPositionY;
        const t = this.insertDurationFrameCount;
        for (let i = 0; i < this.tupleFieldCount; i += 1) {
            const newElement = new VisualDataElement();
            const x = random(-100, 100) * unitLength;
            const y = random(-150, 0) * unitLength;
            const targetX = this.tupleCreatingPositionX + this.tupleCreatingOffsetPositionXArray[i];
            newElement.body.setPosition(x, y);
            this.setBodyVelocity(newElement.body, targetX, targetY, t);
            newElement.body.bodySize = this.elementSize;
            compositeElement.add(newElement);
        }
        compositeElement.beginAppear(0.5 * IDEAL_FRAME_RATE);
        this.elementArray.push(compositeElement);
    }
    delete() {
        let index = null;
        for (let i = 0, len = this.tupleArray.length; i < len; i += 1) {
            if (this.tupleArray[i].kinematicQuantity.velocity.y < -10 * unitSpeed)
                continue;
            if (Math.random() < 0.2) {
                index = i;
                break;
            }
        }
        if (index === null)
            return;
        const deletingTuple = this.tupleArray[index];
        deletingTuple.beginDisappear(0.25 * IDEAL_FRAME_RATE);
        deletingTuple.kinematicQuantity.velocity.set(100 * unitSpeed, 0);
        this.deletingTupleArray.push(this.tupleArray.splice(index, 1)[0]);
    }
    isInsertable() {
        return (this.tupleArray.length + this.elementArray.length) < this.tupleArrayLimitLength;
    }
    isDeletable() {
        return this.tupleArray.length > 0 && this.elementArray.length === 0;
    }
}
// ------------ Set -----------
class SetVisualizer extends DataStructureVisualizer {
    constructor(x, y) {
        super(x, y, 'Set');
        // Arrays
        this.elementArray = SpriteArray.create();
        this.addingElementArray = SpriteArray.create();
        this.deletingElementArray = SpriteArray.create();
        // VisualSetElement
        const displaySize = 130 * unitLength;
        const offsetDistance = 20 * unitLength;
        const setPositionY = -10 * unitLength;
        this.elementSetA = new VisualSetElement(-offsetDistance, setPositionY + offsetDistance, displaySize);
        this.elementSetB = new VisualSetElement(+offsetDistance, setPositionY - offsetDistance, displaySize);
        // Constants
        this.elementLimitCount = 16;
        this.addDurationFrameCount = 0.5 * IDEAL_FRAME_RATE;
        // Target positions
        this.targetPositionArray = [];
        const targetOffsetPosition = 0.2 * displaySize;
        this.targetPositionArray.push(createVector(this.elementSetA.position.x - targetOffsetPosition, this.elementSetA.position.y + targetOffsetPosition));
        this.targetPositionArray.push(createVector(this.elementSetB.position.x + targetOffsetPosition, this.elementSetB.position.y - targetOffsetPosition));
        this.targetPositionArray.push(p5.Vector.add(this.elementSetA.position, this.elementSetB.position).mult(0.5));
    }
    step() {
        this.elementArray.step();
        this.addingElementArray.step();
        this.deletingElementArray.step();
        this.updateAddingElements();
        this.updateDeletingElements();
        this.elementSetA.constrainElementsPosition(this.elementArray);
        this.elementSetB.constrainElementsPosition(this.elementArray);
        if (frameCount % Math.floor(0.25 * IDEAL_FRAME_RATE) === 0) {
            if (Math.random() < 1 - this.elementArray.length / this.elementLimitCount) {
                this.add();
            }
            else {
                if (Math.random() < 0.5)
                    this.delete();
            }
        }
    }
    drawAnimation() {
        this.elementSetA.draw();
        this.elementSetB.draw();
        this.elementArray.draw();
        this.addingElementArray.draw();
        this.deletingElementArray.draw();
    }
    updateAddingElements() {
        for (let i = this.addingElementArray.length - 1; i >= 0; i -= 1) {
            const element = this.addingElementArray[i];
            element.body.accelerate(0, this.gravityConstant);
            if (element.properFrameCount >= this.addDurationFrameCount) {
                element.body.velocity.set(p5.Vector.random2D().mult(50 * unitSpeed));
                if (this.elementSetA.overlap(element) >= 0)
                    this.elementSetA.add(element);
                if (this.elementSetB.overlap(element) >= 0)
                    this.elementSetB.add(element);
                this.elementArray.push(this.addingElementArray.splice(i, 1)[0]);
            }
        }
    }
    updateDeletingElements() {
        for (let i = this.deletingElementArray.length - 1; i >= 0; i -= 1) {
            const element = this.deletingElementArray[i];
            element.body.accelerate(0, this.gravityConstant);
        }
    }
    add() {
        const newElement = new VisualDataElement();
        const targetPosition = getRandom(this.targetPositionArray);
        newElement.body.bodySize = 12 * unitLength;
        newElement.body.position.set(random(-100, 0), random(-170, -100));
        this.setBodyVelocity(newElement.body, targetPosition.x, targetPosition.y, this.addDurationFrameCount);
        newElement.beginAppear(0.5 * IDEAL_FRAME_RATE);
        this.addingElementArray.push(newElement);
    }
    delete() {
        const deletingElement = popRandom(this.elementArray);
        const speed = 200 * unitSpeed;
        const directionAngle = random(PI + QUARTER_PI, PI + HALF_PI + QUARTER_PI);
        deletingElement.body.velocity.add(speed * cos(directionAngle), speed * sin(directionAngle));
        deletingElement.beginDisappear(0.5 * IDEAL_FRAME_RATE);
        this.elementSetA.delete(deletingElement);
        this.elementSetB.delete(deletingElement);
        this.deletingElementArray.push(deletingElement);
    }
}
class VisualSetElement {
    constructor(x, y, displaySize) {
        this.isRemoved = false;
        this.position = createVector(x, y);
        this.dataElementSet = new Set();
        this.diameter = displaySize;
        this.radius = 0.5 * this.diameter;
        this.shapeColor = new ShapeColor(color(128), color(128, 32));
        this.area = new CircularArea(this.position, this.radius);
    }
    step() {
    }
    draw() {
        this.shapeColor.apply();
        ellipse(this.position.x, this.position.y, this.diameter, this.diameter);
    }
    add(element) {
        this.dataElementSet.add(element);
    }
    delete(element) {
        this.dataElementSet.delete(element);
    }
    overlap(element) {
        return this.area.overlap(element.body);
    }
    constrainElementsPosition(array) {
        for (const element of array) {
            if (this.dataElementSet.has(element)) {
                this.area.keepIn(element.body);
            }
            else {
                this.area.keepOut(element.body);
            }
        }
    }
}
// ------------ Graph -----------
class GraphVisualizer extends DataStructureVisualizer {
    constructor(x, y) {
        super(x, y, 'Graph');
        // Graph and Arrays
        this.graph = new VisualGraph();
        this.addingElementArray = SpriteArray.create();
        this.deletingElementArray = SpriteArray.create();
        // Constants
        this.elementLimitCount = 8;
        this.addDurationFrameCount = 0.5 * IDEAL_FRAME_RATE;
        this.targetPosition = createVector(0, -10 * unitLength);
    }
    step() {
        this.graph.step();
        this.addingElementArray.step();
        this.deletingElementArray.step();
        this.updateAddingElements();
        this.updateDeletingElements();
        if (frameCount % Math.floor(0.25 * IDEAL_FRAME_RATE) === 0) {
            if (Math.random() < 1 - this.graph.nodeSet.size / this.elementLimitCount) {
                this.add();
            }
            else {
                if (Math.random() < 0.3)
                    this.delete();
            }
        }
    }
    drawAnimation() {
        this.graph.draw();
        this.addingElementArray.draw();
        this.deletingElementArray.draw();
    }
    updateAddingElements() {
        for (let i = this.addingElementArray.length - 1; i >= 0; i -= 1) {
            this.addingElementArray[i].body.accelerate(0, this.gravityConstant);
            if (this.addingElementArray[i].properFrameCount >= this.addDurationFrameCount) {
                this.completeAdd(i);
            }
        }
    }
    completeAdd(elementIndex) {
        const element = this.addingElementArray[elementIndex];
        element.body.velocity.set(random(-1, 1), random(-1, 1));
        element.body.setFriction(0.1);
        const adjacentElement = this.graph.nodeSet.getRandomSubset(3);
        this.graph.nodeSet.add(this.addingElementArray.splice(elementIndex, 1)[0]);
        for (const eachAdjacentElement of adjacentElement) {
            this.graph.edgeSet.add(new VisualEdge(element, eachAdjacentElement));
        }
    }
    updateDeletingElements() {
        for (let i = this.deletingElementArray.length - 1; i >= 0; i -= 1) {
            const element = this.deletingElementArray[i];
            element.body.accelerate(0, this.gravityConstant);
        }
    }
    add() {
        const newElement = new VisualDataElement();
        newElement.body.bodySize = 12 * unitLength;
        newElement.body.position.set(random(-100, 0), random(-170, -100));
        this.setBodyVelocity(newElement.body, this.targetPosition.x, this.targetPosition.y, this.addDurationFrameCount);
        newElement.beginAppear(0.5 * IDEAL_FRAME_RATE);
        this.addingElementArray.push(newElement);
    }
    delete(element) {
        let deletingElement;
        if (element) {
            this.graph.deleteNode(element);
            deletingElement = element;
        }
        else {
            deletingElement = this.graph.popRandom();
        }
        const speed = 200 * unitSpeed;
        const directionAngle = random(PI + QUARTER_PI, PI + HALF_PI + QUARTER_PI);
        deletingElement.body.velocity.add(speed * cos(directionAngle), speed * sin(directionAngle));
        deletingElement.body.setFriction(0);
        deletingElement.beginDisappear(0.5 * IDEAL_FRAME_RATE);
        this.deletingElementArray.push(deletingElement);
        // delete other isolated elements
        for (const eachElement of this.graph.nodeSet) {
            if (this.graph.nodeSet.size <= 3)
                break;
            if (this.graph.getIncidentEdgeSet(eachElement).size === 0)
                this.delete(eachElement);
        }
    }
}
class VisualGraph {
    constructor() {
        this.nodeSet = new SpriteSet();
        this.edgeSet = new SpriteSet();
        this.area = new CircularArea(createVector(0, -10 * unitLength), 100 * unitLength);
    }
    getIncidentEdgeSet(element) {
        const array = new SpriteSet();
        for (const edge of this.edgeSet) {
            if (edge.isIncidentTo(element))
                array.add(edge);
        }
        return array;
    }
    deleteNode(element) {
        this.deleteIncidentEdges(element);
        this.nodeSet.delete(element);
    }
    deleteIncidentEdges(element) {
        const edgeSet = this.getIncidentEdgeSet(element);
        for (const eachEdge of edgeSet) {
            eachEdge.isRemoved = true;
            this.edgeSet.delete(eachEdge);
        }
    }
    step() {
        this.edgeSet.step();
        roundRobin(this.nodeSet, this.applyCoulombForce);
        this.nodeSet.step();
        for (const element of this.nodeSet) {
            this.area.keepIn(element.body, 0);
        }
    }
    draw() {
        this.edgeSet.draw();
        this.nodeSet.draw();
    }
    popRandom() {
        const element = this.nodeSet.popRandom();
        const edgeSet = this.getIncidentEdgeSet(element);
        for (const eachEdge of edgeSet) {
            eachEdge.isRemoved = true;
            this.edgeSet.delete(eachEdge);
        }
        return element;
    }
    applyCoulombForce(element, otherElement) {
        element.body.attract(otherElement.body, -0.2);
    }
}
//
// ------------ Frame counter -----------------------------
//
class FrameCounter {
    constructor(on, duration) {
        this.isOn = on;
        this.count = 0;
        this.durationFrameCount = duration || null;
    }
    on(duration) {
        this.isOn = true;
        this.durationFrameCount = duration || null;
    }
    off() {
        this.isOn = false;
    }
    reset() {
        this.count = 0;
    }
    step() {
        if (!this.isOn)
            return;
        this.count += 1;
        if (this.isCompleted())
            this.isOn = false;
    }
    getProgressRatio() {
        if (this.durationFrameCount)
            return constrain(this.count / this.durationFrameCount, 0, 1);
        else
            return 0;
    }
    isCompleted() {
        if (this.durationFrameCount)
            return this.count > this.durationFrameCount;
        else
            return false;
    }
    mod(divisor) {
        return this.count % divisor;
    }
}
//
// ------------ Kinematic quantity -----------------------------
//
class KinematicQuantity {
    constructor() {
        this.position = createVector();
        this.velocity = createVector();
    }
    step() {
        this.position.add(this.velocity);
    }
    bounce(normalUnitVector, restitution = 1) {
        this.velocity.add(p5.Vector.mult(normalUnitVector, (1 + restitution) * p5.Vector.dot(this.velocity, p5.Vector.mult(normalUnitVector, -1))));
    }
}
//
// ------------ Physics body -----------------------------
//  Depends on: Kinematic quantity
//
class PhysicsBody {
    constructor() {
        this.kinematicQuantity = new KinematicQuantity();
        this.bodySize = 1;
        this.collisionRadius = 0.5 * this.bodySize;
        this.hasFriction = false;
        this.decelerationFactor = 1;
    }
    get position() {
        return this.kinematicQuantity.position;
    }
    get x() {
        return this.kinematicQuantity.position.x;
    }
    get y() {
        return this.kinematicQuantity.position.y;
    }
    get velocity() {
        return this.kinematicQuantity.velocity;
    }
    get vx() {
        return this.kinematicQuantity.velocity.x;
    }
    get vy() {
        return this.kinematicQuantity.velocity.y;
    }
    setPosition(x, y) {
        this.kinematicQuantity.position.set(x, y);
    }
    setVelocity(vx, vy) {
        this.kinematicQuantity.velocity.set(vx, vy);
    }
    setFriction(constant) {
        if (constant === 0) {
            this.hasFriction = false;
            return;
        }
        this.hasFriction = true;
        this.decelerationFactor = 1 - constant;
    }
    step() {
        this.kinematicQuantity.step();
        if (this.hasFriction) {
            this.kinematicQuantity.velocity.mult(this.decelerationFactor);
        }
    }
    accelerate(x, y) {
        this.kinematicQuantity.velocity.add(x, y);
    }
    collide(other) {
        return true;
    }
    attract(other, factor) {
        const relativePosition = createVector(other.position.x - this.position.x, other.position.y - this.position.y);
        const magnitude = factor / Math.min(1, relativePosition.magSq());
        const direction = relativePosition.normalize();
        const acceleration = direction.mult(magnitude);
        this.velocity.add(acceleration);
        other.velocity.sub(acceleration);
    }
}
//
// --------- ShapeColor (Composite of fill & stroke) -------------
//
class AbstractShapeColor {
    static createAlphaColorArray(c) {
        const array = [];
        for (let alphaValue = 0; alphaValue <= 255; alphaValue += 1) {
            array.push(color(red(c), green(c), blue(c), alpha(c) * alphaValue / 255));
        }
        return array;
    }
}
class ShapeColor extends AbstractShapeColor {
    constructor(strokeColor, fillColor) {
        super();
        this.strokeColorArray = AbstractShapeColor.createAlphaColorArray(strokeColor);
        this.fillColorArray = AbstractShapeColor.createAlphaColorArray(fillColor);
    }
    apply(alphaValue = 255) {
        const index = Math.floor(constrain(alphaValue, 0, 255));
        stroke(this.strokeColorArray[index]);
        fill(this.fillColorArray[index]);
    }
}
class NoStrokeShapeColor extends AbstractShapeColor {
    constructor(fillColor) {
        super();
        this.fillColorArray = AbstractShapeColor.createAlphaColorArray(fillColor);
    }
    apply(alphaValue = 255) {
        noStroke();
        const index = Math.floor(constrain(alphaValue, 0, 255));
        fill(this.fillColorArray[index]);
    }
}
class NoFillShapeColor extends AbstractShapeColor {
    constructor(strokeColor) {
        super();
        this.strokeColorArray = AbstractShapeColor.createAlphaColorArray(strokeColor);
    }
    apply(alphaValue = 255) {
        const index = Math.floor(constrain(alphaValue, 0, 255));
        stroke(this.strokeColorArray[index]);
        noFill();
    }
}
class NullShapeColor extends AbstractShapeColor {
    apply() { }
}
//
// ------------ Global variables ------------------------------
//
p5.disableFriendlyErrors = true;
const IDEAL_FRAME_RATE = 60;
const UNIT_ANGLE_VELOCITY = (2 * Math.PI) / IDEAL_FRAME_RATE;
let unitLength;
let unitSpeed;
const visualizerSet = new Set();
//
// ------------ Setup & Draw etc. ---------------------------------------
//
function setup() {
    const canvasSideLength = Math.min(windowWidth, windowHeight);
    createCanvas(canvasSideLength, canvasSideLength);
    frameRate(IDEAL_FRAME_RATE);
    unitLength = Math.min(width, height) / 640;
    unitSpeed = unitLength / IDEAL_FRAME_RATE;
    strokeWeight(Math.max(1, 1 * unitLength));
    textAlign(CENTER);
    textSize(20 * unitLength);
    visualizerSet.add(new StackVisualizer(0.25 * width, 0.25 * height));
    visualizerSet.add(new SetVisualizer(0.75 * width, 0.25 * height));
    visualizerSet.add(new TableVisualizer(0.25 * width, 0.75 * height));
    visualizerSet.add(new GraphVisualizer(0.75 * width, 0.75 * height));
}
function draw() {
    background(240);
    for (const visualizer of visualizerSet) {
        visualizer.step();
        visualizer.draw();
    }
}
function keyPressed() {
    if (keyCode === 80)
        noLoop(); // 80: 'P'
}
function keyReleased() {
    if (keyCode === 80)
        loop(); // 80: 'P'
}
//
// ------------ Sprite -------------------------------------
//  Depends on: Collection utility
//
class SpriteArray extends Array {
    constructor() {
        super();
    }
    static create() {
        return Object.create(SpriteArray.prototype);
    }
    step() {
        for (let i = this.length - 1; i >= 0; i -= 1) {
            this[i].step();
            if (this[i].isRemoved)
                this.splice(i, 1);
        }
    }
    draw() {
        for (let i = this.length - 1; i >= 0; i -= 1) {
            this[i].draw();
        }
    }
}
class SpriteSet extends Set {
    constructor() {
        super(...arguments);
        this.stepSprite = (sprite) => {
            sprite.step();
            if (sprite.isRemoved)
                this.delete(sprite);
        };
        this.drawSprite = (sprite) => {
            sprite.draw();
        };
    }
    getRandom() {
        return getRandom(Array.from(this));
    }
    popRandom() {
        const sprite = this.getRandom();
        this.delete(sprite);
        return sprite;
    }
    getRandomSubset(size) {
        const newSet = new SpriteSet();
        const temporalArray = Array.from(this);
        const len = Math.min(size, this.size);
        for (let i = 0; i < len; i += 1) {
            newSet.add(popRandom(temporalArray));
        }
        return newSet;
    }
    step() {
        this.forEach(this.stepSprite);
    }
    draw() {
        this.forEach(this.drawSprite);
    }
}
//
// ------------ Visual data element ---------------------------------------
//
class AbstractVisualDataElement {
    constructor() {
        this.properFrameCount = 0;
        this.appearingFrameCounter = new FrameCounter(false);
        this.disappearingFrameCounter = new FrameCounter(false);
    }
    step() {
        this.stepElement(this);
        this.appearingFrameCounter.step();
        this.disappearingFrameCounter.step();
        if (this.disappearingFrameCounter.isCompleted())
            this.isRemoved = true;
        this.properFrameCount += 1;
    }
    draw() {
        this.drawElement(this);
    }
    getAlpha(element) {
        if (element.appearingFrameCounter.isOn) {
            return (-sq(element.getAppearingRatio() - 1) + 1) * 255;
        }
        else if (element.disappearingFrameCounter.isOn) {
            return (1 - sq(element.getDisappearingRatio())) * 255;
        }
        else {
            return 255;
        }
    }
    beginAppear(duration) {
        this.appearingFrameCounter.on(duration);
    }
    beginDisappear(duration) {
        this.disappearingFrameCounter.on(duration);
    }
    getAppearingRatio() {
        return this.appearingFrameCounter.getProgressRatio();
    }
    getDisappearingRatio() {
        return this.disappearingFrameCounter.getProgressRatio();
    }
}
class VisualDataElement extends AbstractVisualDataElement {
    constructor() {
        super();
        this.body = new PhysicsBody();
        this.drawBodyShape = VisualDataElement.defaultDrawBodyShape;
        this.shapeColor = new NoStrokeShapeColor(color(32));
    }
    stepElement(element) {
        element.body.step();
    }
    drawElement(element, parentElementAlpha = 255) {
        const alphaValue = this.getAlpha(this) * parentElementAlpha / 255;
        element.shapeColor.apply(alphaValue);
        element.drawBodyShape(element.body);
    }
}
VisualDataElement.defaultDrawBodyShape = (body) => {
    ellipse(body.x, body.y, body.bodySize, body.bodySize);
};
class CompositeVisualDataElement extends AbstractVisualDataElement {
    constructor() {
        super();
        this.isMovable = false;
        this.kinematicQuantity = new PhysicsBody();
        this.centerPosition = createVector();
        this.childElementArray = SpriteArray.create();
    }
    add(element) {
        this.childElementArray.push(element);
    }
    stepElement(element) {
        element.childElementArray.step();
        this.kinematicQuantity.step();
    }
    drawElement(element, parentElementAlpha = 255) {
        if (this.isMovable) {
            translate(this.kinematicQuantity.position.x, this.kinematicQuantity.position.y);
        }
        const alphaValue = this.getAlpha(this) * parentElementAlpha / 255;
        for (const eachElement of element.childElementArray) {
            eachElement.drawElement(eachElement, alphaValue);
        }
        if (this.isMovable) {
            translate(-this.kinematicQuantity.position.x, -this.kinematicQuantity.position.y);
        }
    }
    getAllLeafElements() {
        const spriteArray = SpriteArray.create();
        for (const eachElement of this.childElementArray) {
            if (eachElement instanceof VisualDataElement) {
                spriteArray.push(eachElement);
            }
            else if (eachElement instanceof CompositeVisualDataElement) {
                Array.prototype.push.apply(spriteArray, eachElement.getAllLeafElements());
            }
        }
        return spriteArray;
    }
    updateCenterPosition() {
        const spriteArray = this.getAllLeafElements();
        let minX = spriteArray[0].body.x;
        let maxX = spriteArray[0].body.x;
        let minY = spriteArray[0].body.y;
        let maxY = spriteArray[0].body.y;
        for (let i = 1, len = spriteArray.length; i < len; i += 1) {
            const currentX = spriteArray[i].body.x;
            const currentY = spriteArray[i].body.y;
            if (currentX < minX)
                minX = currentX;
            if (currentX > maxX)
                maxX = currentX;
            if (currentY < minY)
                minY = currentY;
            if (currentY > maxY)
                maxY = currentY;
        }
        this.centerPosition.set(0.5 * (minX + maxX), 0.5 * (minY + maxY));
    }
}
class VisualEdge {
    constructor(nodeA, nodeB) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.isRemoved = false;
        this.strokeColor = color(64);
        this.equilibriumLength = 70 * unitLength;
        this.springConstant = 0.005;
    }
    isIncidentTo(element) {
        return element === this.nodeA || element === this.nodeB;
    }
    step() {
        const bodyA = this.nodeA.body;
        const bodyB = this.nodeB.body;
        const direction = p5.Vector.sub(bodyB.position, bodyA.position).normalize();
        const stretch = bodyA.position.dist(bodyB.position) - this.equilibriumLength;
        const kx = this.springConstant * stretch;
        bodyB.accelerate(-kx * direction.x, -kx * direction.y);
        bodyA.accelerate(+kx * direction.x, +kx * direction.y);
    }
    draw() {
        stroke(this.strokeColor);
        line(this.nodeA.body.x, this.nodeA.body.y, this.nodeB.body.x, this.nodeB.body.y);
    }
}
