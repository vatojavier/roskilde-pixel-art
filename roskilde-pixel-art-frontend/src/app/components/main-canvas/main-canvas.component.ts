import { Component, OnInit, ViewChild, ElementRef, NgModule, } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { AppComponent } from 'src/app/app.component';


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

  tileNumberX: number;
  tileNumberY: number;

  tileSizeX: number;
  tileSizeY: number;

  canvasWidth: number;
  canvasHeight: number;

  msg: string = 'wassup';
  canvasData: any[] = [];

  constructor(
    private http: HttpClient, // Error here
    private websocketService: WebsocketService,
  ) {

  }
  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;

  private context: CanvasRenderingContext2D | null = null;

  

  ngOnInit(): void {
    
    // Fetch msg from backend.
    this.http.get('http://localhost:5000/api/get_msg').subscribe((data: any) => {
      this.msg = data.message;
      console.log(this.msg);
    });


    // Measure the time it takes to fetch the canvas data
    const t0 = performance.now();
    this.fetchCanvasData();
    const t1 = performance.now();

    console.log('Fetching canvas data took ' + (t1 - t0) + ' milliseconds.');




    this.websocketService.connect();
    console.log('Connected to websocket')

    this.websocketService.onMessage().subscribe((response) => {
      console.log('onMessage response', response);
    });

    this.websocketService.onDraw().subscribe((response: any) => {
      console.log('onDraw response', response);
      this.drawFromGrid(response.x, response.y, response.color);
    });

  }

  fetchCanvasData(): void {
    this.http.get<any[]>('http://localhost:5000/api/get_canvas').subscribe(
      (data: any[]) => {

        this.canvasData = data;
        console.log('this.canvasData', this.canvasData);
        this.fillTilesWithData();
      },
      (error) => {
        console.error('Error fetching canvas data:', error);
      }
    );
  }
  fillTilesWithData() {
    const canvasElement = this.canvas.nativeElement;
    for (let i = 0; i < this.canvasData.length; i++) {
      const x = i % this.tileNumberX;
      const y = Math.floor(i / this.tileNumberX);
      this.drawFromGrid(x, y, this.canvasData[i]);
      // console.log('x, y, this.canvasData[i]', x, y, this.canvasData[i]);
    }
  }

  ngAfterViewInit() {
    const canvasElement = this.canvas.nativeElement
    this.context = canvasElement.getContext('2d');
    console.log('this.context', this.context)

    // canvasElement.addEventListener('click', this.handleCanvasClick.bind(this));

    this.tileNumberX = 200;
    this.tileNumberY = 100;

    this.canvasWidth = canvasElement.width;
    this.canvasHeight = canvasElement.height;

    // Check that the ratio makes squared tiles
    if (this.canvasWidth / this.tileNumberX != this.canvasHeight / this.tileNumberY) {
      console.error('The ratio of the canvas width and height does not match the ratio of the tile numbers');
    }

    // this.gridSize = 50;
    this.pixelSize = canvasElement.width / this.gridSize;

    // Calculate the size of each tile
    this.tileSizeX = this.canvasWidth / this.tileNumberX;
    this.tileSizeY = this.canvasHeight / this.tileNumberY;

    // Draw the grid
    for (let i = 0; i < this.tileNumberX; i++) {
      for (let j = 0; j < this.tileNumberY; j++) {
        this.context.strokeRect(i * this.tileSizeX, j * this.tileSizeY, this.tileSizeX, this.tileSizeY);
      }
    }
    
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

  // handleCanvasClick(event: MouseEvent): void {
  //   const canvasElement = this.canvas.nativeElement;
  //   const rect = canvasElement.getBoundingClientRect();

  //   const x = Math.floor((event.clientX - rect.left) / this.pixelSize);
  //   const y = Math.floor((event.clientY - rect.top) / this.pixelSize);
  //   this.drawPixel(x, y, this.selectedPixelColor, true); 
  // }

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

  // drawPixel(x: number, y: number, color: string, emit: boolean): void {
  //   console.log('drawPixel',x,y,color);
  //   this.context.fillStyle = color;
  //   this.context.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
  //   if (emit){
  //     this.sendMessage('draw', {x: x, y: y, color: color});
  //   }
  // }

  drawFromGrid(x: number, y: number, color: string): void {
    // Verify that the x and y are valid
    if (x < 0 || x >= this.tileNumberX || y < 0 || y >= this.tileNumberY) {
      console.log('Invalid grid coordinates', x, y);
      return;
    }
    // Draw the pixel
    this.context.fillStyle = color;
    this.context.fillRect(x * this.tileSizeX, y * this.tileSizeY, this.tileSizeX, this.tileSizeY);
  }

  draw(x: number, y: number, color: string = this.selectedPixelColor, emit: boolean = true, isOwner: boolean = true): void {

    const canvasElement = this.canvas.nativeElement;
    const rect = canvasElement.getBoundingClientRect();

    let canvasX = Math.floor((x - rect.left) / this.tileSizeX);
    let canvasY = Math.floor((y - rect.top) / this.tileSizeY);

    // canvasX = x - rect.left;
    // canvasY = y - rect.top;

    console.log('draw', x, y, canvasX, canvasY, color);

    this.context.fillStyle = color;

    this.context.fillRect(canvasX * this.tileSizeX, canvasY * this.tileSizeY, this.tileSizeX, this.tileSizeY);

    if (emit) {
      this.sendMessage('draw', { x: canvasX, y: canvasY, color: color });
    }
    if (isOwner) {
      this.totalPixels += 1;
    }
  }

}
