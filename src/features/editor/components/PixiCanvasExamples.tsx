// import React, {useEffect, useRef} from 'react';
// import {Application, Assets, Graphics, Point, Polygon, Text, TextStyle, Sprite, Container} from 'pixi.js';
//
// interface PixiCanvasProps {
//     width: number;
//     height: number;
// }
//
// const PixiCanvasExamples: React.FC<PixiCanvasProps> = ({width, height}) => {
//     const canvasRef = useRef<HTMLDivElement | null>(null);
//     const appRef = useRef<Application | null>(null);
//
//     useEffect(() => {
//         let cancelled = false;
//
//         const app = new Application();
//         appRef.current = app;
//
//         app.init({
//             // webgpu: undefined,
//             width,
//             height,
//             background: '#ffffff',
//         }).then(async () => {
//
//             app.canvas.style.position = 'absolute';
//             app.renderer.background.alpha = 0.2
//             if (cancelled || !canvasRef.current) return;
//
//             if ("appendChild" in canvasRef.current) {
//                 canvasRef.current.appendChild(app.canvas);
//             }
//
//             const rectangle = new Graphics()
//                 .rect(200, 200, 100, 200)
//                 .fill({color: 0x00ccff, alpha: 0.1})
//                 .stroke({
//                     width: 5,
//                     color: 0x00ff00
//                 });
//
//             // Container Example
//             const polygonsContainer = new Container()
//             app.stage.addChild(polygonsContainer);
//
//
//
//             // Polygons Example 1
//             const coordinates = [{x: 101, y: 101}, {x: 202, y: 202}, {x: 301, y: 301}, {
//                 x: 402,
//                 y: 402
//             }, {x: 501, y: 501}, {x: 671, y: 592}]
//             const polygon = new Graphics().poly(coordinates).fill({color: 0x00ccff, alpha: 0.1})
//                 .stroke({
//                     width: 5,
//                     color: 0x00ff00
//                 })
//                 .closePath();
//             console.log("polygon", polygon)
//             // Polygons Example 2
//             const polygons = [
//                 new Polygon([new Point(0, 0), new Point(0, 100), new Point(100, 100)]), // polygon1
//                 new Polygon([0, 0, 0, 100, 100, 100]), // polygon2
//                 new Polygon(new Point(200, 200), new Point(200, 100), new Point(300, 300)), // polygon3
//                 new Polygon(0, 0, 0, 100, 100, 100) // polygon4
//             ];
//
//             polygons.forEach((poly, i) => {
//                 const g = new Graphics()
//                     .poly(poly.points)
//                     .stroke({width: 5, color: 0x00ff00})
//                     .fill({color: 0xff0000, alpha: 0.5})
//                     .closePath();
//
//                 g.x = i * 120;
//                 g.y = 50;
//                 polygonsContainer.addChild(g)
//             });
//
//             const outerSquare = new Polygon([0, 0, 100, 0, 100, 100, 0, 100]); // A square
//             const innerSquare = new Polygon([25, 25, 75, 25, 75, 75, 25, 75]); // A smaller square inside
//
//             outerSquare.containsPolygon(innerSquare); // Returns true
//             innerSquare.containsPolygon(outerSquare); // Returns false
//
//             const style = new TextStyle({
//                 fontSize: 100,
//                 fill: "#000000",
//                 fontFamily: "Helvetica",
//             })
//             const text = new Text({
//                 text: "Shit!",
//                 style
//             })
//
//             // option 1
//             // text.x = 600
//             // text.y = 400
//
//             // option 2
//             // text.position.x = 600
//             // text.position.y = 400
//
//             // option 3
//             text.position.set(600, 400)
//
//             // option 4
//             // text.skew.x = Math.PI / 4;
//             text.skew.set(Math.PI / 4, 0)
//
//             const response = await fetch('/public/C06-AR03-PR12-FL0-AP.svg');
//             const svgString = await response.text();
//             const g = new Graphics();
//             await g.svg(svgString);
//             app.stage.addChild(g);
//
//
//             const texture = await Assets.load('/public/C06-AR03-PR12-FL0-AP.svg')
//             const sprite = Sprite.from(texture);
//             // scaling option 1
//             // sprite.width = width
//             // sprite.height = height
//
//             // scaling option 2
//             // sprite.scale.x = 0.5
//             // sprite.scale.y = 2
//
//             // scaling option 3
//             sprite.scale.set(0.5, 2)
//
//             // rotation options
//             // sprite.rotation = Math.PI / 4;
//             // sprite.pivot.x = 100
//             // sprite.pivot.y = 200
//             // sprite.anchor.x = 0.5
//             // sprite.anchor.y = 0.5
//             sprite.anchor.set(0.5, 0.5)
//
//             // pointer event
//             sprite.eventMode = 'static'
//             sprite.on('mousedown', moveShape)
//             sprite.cursor = 'pointer'
//             function moveShape(e) {
//                 console.log("moveShape e", e)
//                 sprite.x += 5
//                 sprite.y -= 5
//             }
//
//             app.stage.addChild(rectangle);
//             app.stage.addChild(text);
//             // app.stage.addChild(sprite);
//         });
//
//         return () => {
//             cancelled = true;
//
//             // Only destroy if it was fully initialized
//             if (appRef.current && appRef.current.renderer) {
//                 appRef.current.destroy(true, {children: true});
//             }
//
//             if (canvasRef.current) {
//                 canvasRef.current.replaceChildren(); // Clear DOM
//             }
//
//             appRef.current = null;
//         };
//     }, [width, height]);
//
//     return <div ref={canvasRef} className="w-full h-full"/>;
// };
//
// export default PixiCanvasExamples;
