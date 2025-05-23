// // src/features/editor/components/pixi/BackgroundRenderer.ts
// import { Container, Sprite, Assets, Texture, Graphics } from 'pixi.js';
//
// export class BackgroundRenderer extends Container {
//     private sprite: Sprite | null = null;
//     private svgUrl: string;
//     private scale: number;
//     private isLoading = false;
//     private texture: Texture | null = null;
//     private loadAttempted = false;
//
//     constructor(svgUrl: string, scale: number) {
//         super();
//         this.label = 'background-renderer';
//         this.svgUrl = svgUrl;
//         this.scale = scale;
//
//         this.loadSvg().then(r => console.log("Background renderer loaded:", r));
//     }
//
//     private async loadSvg() {
//         if (this.isLoading || !this.svgUrl || this.loadAttempted) return;
//
//         this.isLoading = true;
//         this.loadAttempted = true;
//
//         try {
//             let textureUrl = this.svgUrl;
//
//             // If the SVG is a data URL, we'll need a different approach
//             if (this.svgUrl.startsWith('data:image/svg+xml;')) {
//                 // For data URLs, we'll just create a Blob and URL
//                 const base64Content = this.svgUrl.split(',')[1];
//                 const svgContent = base64Content.startsWith('base64,')
//                     ? atob(base64Content.substring(7))
//                     : decodeURIComponent(base64Content);
//
//                 const blob = new Blob([svgContent], { type: 'image/svg+xml' });
//                 textureUrl = URL.createObjectURL(blob);
//             }
//
//             // Wrap in try-catch since this might fail
//             try {
//                 // Load the SVG as a texture
//                 this.texture = await Assets.load(textureUrl);
//
//                 // Create sprite from texture
//                 this.sprite = Sprite.from(this.texture);
//
//                 // Set opacity
//                 this.sprite.alpha = 0.7; // Semi-transparent background
//
//                 // Add sprite to container
//                 this.addChild(this.sprite);
//             } catch (loadError) {
//                 console.error('Error loading SVG texture:', loadError);
//
//                 // Fallback: Create a simple placeholder rectangle
//                 const placeholderGraphics = new Graphics()
//                     .rect(0, 0, 500, 500)
//                     .fill({color:"0xf0f0f0", alpha: 0.5});
//
//                 this.addChild(placeholderGraphics);
//             }
//
//             this.isLoading = false;
//         } catch (error) {
//             console.error('Error loading SVG background:', error);
//             this.isLoading = false;
//         }
//     }
//
//     // Change SVG source
//     public updateSvg(svgUrl: string) {
//         if (this.svgUrl === svgUrl) return;
//
//         this.svgUrl = svgUrl;
//         this.loadAttempted = false;
//
//         // Remove existing sprite
//         if (this.sprite) {
//             this.removeChild(this.sprite);
//             this.sprite = null;
//         }
//
//         // Load new SVG
//         this.loadSvg().then(r => console.log("Background renderer loaded:", r));
//     }
//
//     // Update opacity
//     public updateOpacity(opacity: number) {
//         if (this.sprite) {
//             this.sprite.alpha = opacity;
//         }
//     }
// }
