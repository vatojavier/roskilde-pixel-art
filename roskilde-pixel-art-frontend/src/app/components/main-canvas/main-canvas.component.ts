import { Component, OnInit, ViewChild, ElementRef, } from '@angular/core';
import { WebsocketService } from 'src/app/shared/services/websocket.service';

@Component({
  selector: 'app-main-canvas',
  templateUrl: './main-canvas.component.html',
  styleUrls: ['./main-canvas.component.css']
})
export class MainCanvasComponent implements OnInit {
  gridSize: number;
  pixelSize: number;
  selectedPixelColor: '#1aa8cb';
  isDrawing = false;
  totalPixels = 0; // get this from cookie
  constructor(private websocketService: WebsocketService) { }
  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;  
  
  private context: CanvasRenderingContext2D | null = null;

  ngOnInit(): void {
    this.websocketService.connect();
    console.log('Connected to websocket')
    this.websocketService.onMessage().subscribe((response) => {
       console.log('onMessage response', response);
    });
    this.websocketService.onDraw().subscribe((response: any) => {
      console.log('onDraw response', response);
      this.draw(response.x, response.y, response.color, false, false);
   });
  }

  ngAfterViewInit() {
    const canvasElement = this.canvas.nativeElement 
    this.context = canvasElement.getContext('2d');
    console.log('this.context', this.context)

    // canvasElement.addEventListener('click', this.handleCanvasClick.bind(this));

    this.gridSize = 50;
    this.pixelSize = canvasElement.width / this.gridSize;


    canvasElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvasElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvasElement.addEventListener('mouseup', this.handleMouseUp.bind(this));
    canvasElement.addEventListener('touchstart', this.handleTouchStart.bind(this));
    canvasElement.addEventListener('touchmove', this.handleTouchMove.bind(this));
    canvasElement.addEventListener('touchend', this.handleTouchEnd.bind(this));

  }

  sendMessage(event: string, messageObject: any): void {
    console.log('sendMessage event messageObject', event, messageObject);

    this.websocketService.sendMessage(event, messageObject);
  }

  handleCanvasClick(event: MouseEvent): void {
    const canvasElement = this.canvas.nativeElement;
    const rect = canvasElement.getBoundingClientRect();

    const x = Math.floor((event.clientX - rect.left) / this.pixelSize);
    const y = Math.floor((event.clientY - rect.top) / this.pixelSize);
    this.drawPixel(x, y, this.selectedPixelColor, true); 
  }

  handleMouseDown(event: MouseEvent): void {
    this.isDrawing = true;
    this.draw(event.clientX, event.clientY);
  }
  
  handleMouseMove(event: MouseEvent): void {
    if (this.isDrawing) {
      this.draw(event.clientX, event.clientY);
    }
  }
  
  handleMouseUp(): void {
    this.isDrawing = false;
  }
  
  handleTouchStart(event: TouchEvent): void {
    this.isDrawing = true;
    const touch = event.touches[0];
    this.draw(touch.clientX, touch.clientY);
  }
  
  handleTouchMove(event: TouchEvent): void {
    if (this.isDrawing) {
      event.preventDefault();
      const touch = event.touches[0];
      this.draw(touch.clientX, touch.clientY);
    }
  }
  
  handleTouchEnd(): void {
    this.isDrawing = false;
  }
  drawPixel(x: number, y: number, color: string, emit: boolean): void {
    console.log('drawPixel',x,y,color);
    this.context.fillStyle = color;
    this.context.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
    if (emit){
      this.sendMessage('draw', {x: x, y: y, color: color});
    }
  }

  draw(x: number, y: number, color: string = this.selectedPixelColor, emit: boolean = true, isOwner : boolean = true): void {
    
    const canvasElement = this.canvas.nativeElement;
    const rect = canvasElement.getBoundingClientRect();

    let canvasX = Math.floor((x - rect.left) / this.pixelSize);
    let canvasY = Math.floor((y - rect.top) / this.pixelSize);

    canvasX = x - rect.left;
    canvasY = y - rect.top;
    
    this.context.fillStyle = color;
    this.context.fillRect(canvasX, canvasY, this.pixelSize, this.pixelSize);
    if (emit){
      this.sendMessage('draw', {x: x, y: y, color: color});
    }
    if(isOwner) {
      this.totalPixels += 1;
    }
  }
}