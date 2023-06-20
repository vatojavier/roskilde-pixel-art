import { Component, OnInit, ViewChild, ElementRef, NgModule, ChangeDetectorRef, } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { AppComponent } from 'src/app/app.component';
import { sizes } from './canvas-sizes';


@Component({
  selector: 'app-main-canvas',
  templateUrl: './main-canvas.component.html',
  styleUrls: ['./main-canvas.component.css']
})

export class MainCanvasComponent implements OnInit {
  gridSize: number;
  pixelSize: number;
  selectedPixelColor = '#1aa8cb';
  isDrawing = false;
  totalPixels = 0; // get this from cookie

  tileNumberX: number = 300;
  tileNumberY: number = 150;

  canvasWidth: number = 1200;
  canvasHeight: number = 600;

  tileSizeX: number;
  tileSizeY: number;


  msg: string = 'wassup';
  canvasData: any[] = [];

  // User id as string
  userID: string = '';

  initialTouchDistance: number = 0;
  initialPixelSize: number;
  selectedCoordinates: any;
  unscaledCoordinates: any;
  currentScaleFactor: number = 1;
  drawableCoordinates: any;
  finalCoordinates: any;
  rectCoordinates: any;
  pixelID: number;
  constructor(
    private http: HttpClient, // Error here
    private websocketService: WebsocketService,
    private changeDetectorRef: ChangeDetectorRef
  ) {

  }
  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;

  private context: CanvasRenderingContext2D | null = null;

  

  ngOnInit(): void {
    

    const selectedSize = sizes['large'];
    this.tileNumberX = selectedSize.tileNumberX;
    this.tileNumberY = selectedSize.tileNumberY;

    this.canvasWidth = selectedSize.canvasWidth;
    this.canvasHeight = selectedSize.canvasHeight;

    // Set cookie and send it with the request
    this.http.get('http://localhost:5000/api/get_cookie', { withCredentials: true }).subscribe((data: any) => {
      // console.log('Cookie:', data);
      this.userID = data.user_id;
      // console.log('UserID:', this.userID);

    });

    // // Fetch msg from backend.
    // this.http.get('http://localhost:5000/api/get_canvas_size').subscribe((data: any) => {

    //   console.log('Canvas size:', data);

    //   this.tileNumberX = data.n_tiles_x;
    //   this.tileNumberY = data.n_tiles_y;

    //   this.canvasWidth = data.canvas_width;
    //   this.canvasHeight = data.canvas_height;

    //   console.log('this.tileNumberX', this.tileNumberX);
    //   console.log('this.tileNumberY', this.tileNumberY);

    //   console.log('this.canvasWidth', this.canvasWidth);
    //   console.log('this.canvasHeight', this.canvasHeight);
    // });

    const t0 = performance.now();
    this.fetchCanvasData();
    const t1 = performance.now();

    console.log('Fetching canvas data took ' + (t1 - t0) + ' milliseconds.');


    this.websocketService.connect();

    this.websocketService.onMessage().subscribe((response) => {
      console.log('onMessage response', response);
    });

    this.websocketService.onDraw().subscribe((response: any) => {
      // console.log('onDraw response', response); 
      this.drawFromTileID(response.pixelID, response.color);
    });

    this.websocketService.onUpdate().subscribe((response: any) => {
      console.log('onUpdate response', response);
    }
    );

  }

  fetchCanvasData(): void {
    this.http.get<any[]>('http://localhost:5000/api/get_canvas').subscribe(
      (data: any[]) => {

        this.canvasData = data;
        // console.log('this.canvasData', this.canvasData);
        this.fillTilesWithData();
      },
      (error) => {
        console.error('Error fetching canvas data:', error);
      }
    );
  }

  fillTilesWithData() {
    const canvasElement = this.canvas.nativeElement;

    console.log('Fetched data of size', this.canvasData.length);

    for (let i = 0; i < this.canvasData.length; i++) {
      const color = this.canvasData[i].toString(16).padStart(6, '0');
      this.drawFromTileID(i, color);
    }
  }

  drawFromTileID(id: number, color: string): void {
    // Verify that the id is valid
    if (id < 0 || id >= this.tileNumberX * this.tileNumberY) {
      console.log('Invalid grid id', id);
      return;
    }

    // Draw the pixel
    const x = id % this.tileNumberX;
    const y = Math.floor(id / this.tileNumberX);
    this.drawFromGrid(x, y, color);
  }

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

  ngAfterViewInit() {

    const canvasElement = this.canvas.nativeElement
    this.context = canvasElement.getContext('2d');
    // this.context.fillStyle = "white";
    this.context.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Check that the ratio makes squared tiles
    if (this.canvasWidth / this.tileNumberX != this.canvasHeight / this.tileNumberY) {
      console.error('The ratio of the canvas width and height does not match the ratio of the tile numbers');
    }

    this.tileSizeX = this.canvasWidth / this.tileNumberX;
    this.tileSizeY = this.canvasHeight / this.tileNumberY;



    console.log('this.tileSizeX', this.tileSizeX);
    console.log('this.tileSizeY', this.tileSizeY);

    
    canvasElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvasElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvasElement.addEventListener('mouseup', this.handleMouseUp.bind(this));
    canvasElement.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    canvasElement.addEventListener('pointermove', this.handlePointerMove.bind(this));
    canvasElement.addEventListener('pointerup', this.handlePointerUp.bind(this));

  }

  sendMessage(event: string, messageObject: any): void {
    // this.websocketService.sendMessage(event, messageObject);
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
    // console.log('rect.left rect.top', rect.left, rect.top)
    this.rectCoordinates = "" + rect.left + " ||" + rect.top
    // console.log('unscaled coordinates', x, y)
    this.unscaledCoordinates = "x:" + x + " y:" + y

    // console.log('drawable coordinates', x - rect.left, y - rect.top)


    let canvasPositionX = x - rect.left;
    let canvasPositionY = y - rect.top;

    // Avoid painting outside the canvas
    if (canvasPositionX < 0 || canvasPositionX >= this.canvasWidth || canvasPositionY < 0 || canvasPositionY >= this.canvasHeight) {
      return;
    }

    let canvasX = Math.floor(canvasPositionX / this.tileSizeX);
    let canvasY = Math.floor(canvasPositionY / this.tileSizeY);
  
    this.pixelID = canvasX + canvasY * this.tileNumberX;
    
    // console.log('draw', x, y);
    // console.log('Canvas position', canvasPositionX, canvasPositionY);

    this.context.fillStyle = this.selectedPixelColor;

    this.context.fillRect(canvasX * this.tileSizeX, canvasY * this.tileSizeY, this.tileSizeX, this.tileSizeY);
    // console.log('PixelID', this.pixelID);
    // console.log('Color', color);

    // this.pixelID = canvasPositionX + canvasPositionY * 200;
    this.drawableCoordinates = "" + canvasX + " " + canvasY
    this.finalCoordinates = "" + (canvasX * this.pixelSize) + " " + (canvasY * this.pixelSize)
    this.context.fillStyle = color;
    this.context.fillRect(
      canvasX * this.tileSizeX,
      canvasY * this.tileSizeY,
      this.tileSizeX,
      this.tileSizeY
    );
    if (emit) {
      // this.sendMessage('draw', { x: canvasX, y: canvasY, color: color });
      // console.log("Drawing")
      console.log('PixelID', this.pixelID);
      this.sendMessage('draw', { pixelID: this.pixelID, color: this.selectedPixelColor, userID: this.userID });
    }
    if  (isOwner) {
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
