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
  initialTouchDistance: number = 0;
  initialPixelSize: number;
  selectedCoordinates: any;
  unscaledCoordinates: any;
  currentScaleFactor: number = 1;
  drawableCoordinates: any;
  finalCoordinates: any;
  rectCoordinates: any;
  pixelID: number;
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
      this.drawOnReceive(response.x, response.y, response.color, false, false);
    });
  }

  ngAfterViewInit() {
    const canvasElement = this.canvas.nativeElement
    this.context = canvasElement.getContext('2d');
    // this.context.fillStyle = "white";
    this.context.fillRect(0, 0, canvasElement.width, canvasElement.height);
    console.log('this.context', this.context)

    this.gridSize = 50;
    this.pixelSize = canvasElement.width / this.gridSize;

    canvasElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvasElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvasElement.addEventListener('mouseup', this.handleMouseUp.bind(this));
    canvasElement.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    canvasElement.addEventListener('pointermove', this.handlePointerMove.bind(this));
    canvasElement.addEventListener('pointerup', this.handlePointerUp.bind(this));

  }

  sendMessage(event: string, messageObject: any): void {
    console.log('sendMessage event messageObject', event, messageObject);

    this.websocketService.sendMessage(event, messageObject);
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

  handlePointerDown(event: PointerEvent): void {
    // this.isDrawing = true;
    if (event.pointerType === 'touch') {
      if (event.isPrimary && event.pointerId === 1) {
        const touch1 = event;
        const touch2 = event.getCoalescedEvents()[0];
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;

        this.initialTouchDistance = Math.sqrt(dx * dx + dy * dy);
        this.initialPixelSize = this.pixelSize;
      } else if (event.isPrimary && event.pointerId === 0) {
        const touch = event;
        this.draw(touch.clientX, touch.clientY);
      }
    }
  }

  handlePointerUp(): void {
    this.isDrawing = false;
  }
  handlePointerMove(event: PointerEvent): void {
    // if (event.pointerType === 'touch' && event.isPrimary && event.pointerId === 1) { //EXPERIMENTAL - KEEP  - POINTER events take care of this 
    //   const touch1 = event;
    //   const touch2 = event.getCoalescedEvents()[0];
    //   const dx = touch1.clientX - touch2.clientX;
    //   const dy = touch1.clientY - touch2.clientY;
    //   const currentTouchDistance = Math.sqrt(dx * dx + dy * dy);

    //   const scaleFactor = currentTouchDistance / this.initialTouchDistance;
    //   this.pixelSize = this.initialPixelSize * scaleFactor;

    //   const canvasElement = this.canvas.nativeElement;
    //   const rect = canvasElement.getBoundingClientRect();
    //   const canvasCenterX = (rect.width / 2 - rect.left) / this.pixelSize;
    //   const canvasCenterY = (rect.height / 2 - rect.top) / this.pixelSize;

    //   const scaledCanvasWidth = rect.width / this.pixelSize;
    //   const scaledCanvasHeight = rect.height / this.pixelSize;
    //   const deltaX = (canvasCenterX - scaledCanvasWidth / 2) * (1 - scaleFactor);
    //   const deltaY = (canvasCenterY - scaledCanvasHeight / 2) * (1 - scaleFactor);

    //   const left = rect.left - deltaX * this.pixelSize;
    //   const top = rect.top - deltaY * this.pixelSize;

    //   canvasElement.style.left = `${left}px`;
    //   canvasElement.style.top = `${top}px`;
    //   this.currentScaleFactor = scaleFactor;
    // } else
    if (event.pointerType === 'touch' && event.isPrimary && event.pointerId === 0) {
      const touch = event;
      const unscaledX = touch.clientX;
      const unscaledY = touch.clientY;
      this.draw(touch.clientX, touch.clientY); // Pass the unscaled coordinates to the draw function
    }
  }

  draw(x: number, y: number, color: string = this.selectedPixelColor, emit: boolean = true, isOwner: boolean = true): void {


    const canvasElement = this.canvas.nativeElement;
    const rect = canvasElement.getBoundingClientRect();
    console.log('rect.left rect.top', rect.left, rect.top)
    this.rectCoordinates = "" + rect.left + " ||" + rect.top
    console.log('unscaled coordinates', x, y)
    this.unscaledCoordinates = "x:" + x + " y:" + y

    console.log('drawable coordinates', x - rect.left, y - rect.top)

    let canvasPositionX = Math.floor((x - rect.left) / 200)
    let canvasPositionY = Math.floor((y - rect.top) / 100)

    this.pixelID = canvasPositionX + canvasPositionY * 200;

    const canvasX = Math.floor((x - rect.left) / this.pixelSize);
    const canvasY = Math.floor((y - rect.top) / this.pixelSize);
    this.drawableCoordinates = "" + canvasX + " " + canvasY
    this.finalCoordinates = "" + (canvasX * this.pixelSize) + " " + (canvasY * this.pixelSize)
    this.context.fillStyle = color;
    this.context.fillRect(
      canvasX * this.pixelSize,
      canvasY * this.pixelSize,
      this.pixelSize,
      this.pixelSize
    );

    if (emit) {
      this.sendMessage('draw', { x: canvasX * this.pixelSize, y: canvasY * this.pixelSize, color: color });
      // this.selectedCoordinates = "X:" + unscaledX + ",y:" + unscaledY;
      // this.sendMessage('draw', { x: unscaledX, y: unscaledY, color: color });
    }

    if (isOwner) {
      this.totalPixels += 1;
    }
  }


  drawOnReceive(x: number, y: number, color: string = this.selectedPixelColor, emit: boolean = true, isOwner: boolean = true): void {
    this.finalCoordinates = "" + x + " " + y
    this.context.fillStyle = color;
    this.context.fillRect(
      x,
      y,
      this.pixelSize,
      this.pixelSize
    );
  }
}
