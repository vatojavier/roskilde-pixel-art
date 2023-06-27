import { Component, OnInit, ViewChild, ElementRef, NgModule, Input, HostListener, } from '@angular/core';
import { HttpClientModule, HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-main-canvas',
  templateUrl: './main-canvas.component.html',
  styleUrls: ['./main-canvas.component.css']
})

export class MainCanvasComponent implements OnInit {
  @Input() isAdmin: boolean = false;
  @Input() isTvView: boolean = false;
  @ViewChild('footer', { static: true }) footerRef: ElementRef;
  @ViewChild('viewport', { static: false }) viewport: ElementRef;
  remainingTime: number = 10; // get this from the server  -  in seconds
  displayTime: string; // Formatted time to display
  isFirstTimeUser: boolean = false;
  gridSize: number;
  pixelSize: number;
  selectedPixelColor = '#1aa8cb';
  isDrawing = false;
  pixelsLeft = 0; // get this from cookie
  totalAllowedPixels = 70;
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
  timeTaken: any;
  deleteMode: boolean = false;
  selectedPixels: any[];
  password: string = '';
  serverURL: 'https://roskildepixel.dk/'
  timer: any;
  defaultTimeout: number = 5;
  correctPassword: any = null;
  constructor(
    private http: HttpClient, // Error here
    private websocketService: WebsocketService,
    private toastr: ToastrService
  ) {

  }
  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;

  @HostListener('window:scroll')
  onScroll() {
    this.adjustFooter();
  }

  private context: CanvasRenderingContext2D | null = null;



  ngOnInit(): void {
    // this.scrollToCenter();
    this.makeInitialDisplayTime()
    // this.remainingTime = 10;
    // Fetch msg from backend.
    // this.http.get('https://roskildepixel.dk/api/get_msg').subscribe((data: any) => {
    //   this.msg = data.message;
    //   console.log(this.msg);
    // });

    // Set cookie and send it with the request
    console.log(('https://roskildepixel.dk/'+'api/get_cookie'))

    this.http.get('https://roskildepixel.dk/'+'api/get_cookie', { withCredentials: true }).subscribe((data: any) => {
      console.log('Cookie:', data);
      this.userID = data.user_id;
      this.isFirstTimeUser = data.is_first_time_user;
      console.log('isFirstTimeUser:', this.isFirstTimeUser);
      console.log('UserID:', this.userID);



      this.http.get('https://roskildepixel.dk/'+'api/get_max_pixels_per_user', { withCredentials: true }).subscribe((data: any) => {
        console.log('Max pixels:', data);
        this.totalAllowedPixels = data.max_pixels_per_user
        this.makeInitialDisplayTime()

      });

      this.http.get('https://roskildepixel.dk/'+'api/get_pixels_left', { withCredentials: true }).subscribe((data: any) => {
        console.log('Pixels left:', data);
        this.pixelsLeft = data.pixels_left
        this.makeInitialDisplayTime()
      });

      this.http.get('https://roskildepixel.dk/'+'api/get_max_cool_down_time', { withCredentials: true }).subscribe((data: any) => {
        console.log('max_cool_down_seconds:', data);
        this.defaultTimeout = data.max_cool_down_seconds
        this.remainingTime = data.max_cool_down_seconds

        this.http.get('https://roskildepixel.dk/' + 'api/get_cool_down_time_left', { withCredentials: true }).subscribe((data: any) => {
          console.log('cool_down_time_left:', data);
          if (data.cool_down_time_left) {
            this.remainingTime = data.cool_down_time_left
            this.startTimer()
          }
          this.makeInitialDisplayTime()

        })
      });

      this.http.get('https://roskildepixel.dk/'+'api/get_cool_down_time_left', { withCredentials: true }).subscribe((data: any) => {
        console.log('cool_down_time_left:', data);
      });


    });


    // this.userID = document.cookie.replace(/(?:(?:^|.*;\s*)user_id\s*\=\s*([^;]*).*$)|^.*$/, "$1");


    // Measure the time it takes to fetch the canvas data
    const t0 = performance.now();
    this.fetchCanvasData();
    const t1 = performance.now();

    console.log('Fetching canvas data took ' + (t1 - t0) + ' milliseconds.');
    this.timeTaken = t1 - t0;

    this.websocketService.connect();

    this.websocketService.onMessage().subscribe((response) => {
      console.log('onMessage response', response);
    });

    this.websocketService.onDraw().subscribe((response: any) => {
      // console.log('onDraw response', response);
      // this.drawFromGrid(response.x, response.y, response.color);

      this.drawFromGridID(response.pixelID, response.color);
    });

    this.websocketService.onUpdate().subscribe((response: any) => {
      console.log('onUpdate response', response);
    }
    );

  }
  ngAfterViewInit() {

    const canvasElement = this.canvas.nativeElement
    this.context = canvasElement.getContext('2d');
    // this.context.fillStyle = "white";
    this.context.fillRect(0, 0, canvasElement.width, canvasElement.height);
    // console.log('this.context', this.context)

    this.tileNumberX = 200;
    this.tileNumberY = 100;

    this.canvasWidth = canvasElement.width;
    this.canvasHeight = canvasElement.height;

    // Check that the ratio makes squared tiles
    if (this.canvasWidth / this.tileNumberX != this.canvasHeight / this.tileNumberY) {
      console.error('The ratio of the canvas width and height does not match the ratio of the tile numbers');
    }

    // this.gridSize = 50;
    // this.pixelSize = canvasElement.width / this.gridSize;

    // Calculate the size of each tile
    this.tileSizeX = this.canvasWidth / this.tileNumberX;
    this.tileSizeY = this.canvasHeight / this.tileNumberY;

    // Draw the grid
    // for (let i = 0; i < this.tileNumberX; i++) {
    //   for (let j = 0; j < this.tileNumberY; j++) {
    //     this.context.strokeRect(i * this.tileSizeX, j * this.tileSizeY, this.tileSizeX, this.tileSizeY);
    //   }
    // }

    canvasElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
    if(this.isAdmin){
      canvasElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }
    canvasElement.addEventListener('mouseup', this.handleMouseUp.bind(this));
    canvasElement.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    canvasElement.addEventListener('pointermove', this.handlePointerMove.bind(this));
    canvasElement.addEventListener('pointerup', this.handlePointerUp.bind(this));
    window.scrollBy(370, 1); //to bring the page to the center, the 1 is so that the footer adjusts properly to the bottom of the page

    // this.adjustFooter();

  }

  formatWelcomeMessagetime(time: number){
    return Math.round(time/60)
  }
  startTimer() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.updateTime();
    }, 1000); // Update time every second
  }


  updateTime() {
    console.log('this.remainingTime start', this.remainingTime)

    if (this.remainingTime > 0) {
      const minutes = Math.floor(this.remainingTime / 60);
      const seconds = this.remainingTime % 60;

      // Format the time as 'mm:ss'
      this.displayTime = `${this.padNumber(minutes)}:${this.padNumber(seconds)}`;

      this.remainingTime--;
    } else if (this.remainingTime === 0) {
      clearInterval(this.timer);
      this.remainingTime = this.defaultTimeout
      console.log('this.remainingTime inside', this.remainingTime)
      this.makeInitialDisplayTime()
      this.pixelsLeft = 0
    }
  }

  padNumber(number: number): string {
    return String(number).padStart(2, '0');
  }

  makeInitialDisplayTime() {
    const minutes = Math.floor(this.remainingTime / 60);
    const seconds = this.remainingTime % 60;

    // Format the time as 'mm:ss'
    this.displayTime = `${this.padNumber(minutes)}:${this.padNumber(seconds)}`;
  }
  // scrollToCenter() {
  //   const options: ScrollToOptions = {
  //     top: window.innerHeight / 2,
  //     behavior: 'smooth'
  //   };

  //   window.scrollTo(options);
  // }
  scrollToCenter() {
    const elementRect = this.viewport.nativeElement.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const middle = absoluteElementTop - (elementRect.height / 2);
    window.scrollTo(0, middle); // have a window object reference in your component
  }
  adjustFooter() {
    const footer: HTMLElement = this.footerRef.nativeElement;
    if(this.isTvView){
      footer.style.display = 'none';  
    }
    footer.style.position = 'absolute';
    footer.style.left = `${window.pageXOffset}px`;
    footer.style.bottom = `${document.documentElement.clientHeight - (window.pageYOffset + window.innerHeight)}px`;
    footer.style.transform = `scale(${window.innerWidth / document.documentElement.clientWidth})`;
  }
  fetchCanvasData(): void {
    this.http.get<any[]>('https://roskildepixel.dk/'+'api/get_canvas').subscribe(
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

    for (let i = 0; i < this.canvasData.length; i++) {
      // const x = i % this.tileNumberX;
      // const y = Math.floor(i / this.tileNumberX);
      // this.drawFromGrid(x, y, this.canvasData[i]);
      // console.log('x, y, this.canvasData[i]', x, y, this.canvasData[i]);

      // Convert hexadecimal number to hex color string with the # prefix
      const color = this.canvasData[i].toString(16).padStart(6, '0');


      // console.log('color', color);

      this.drawFromGridID(i, color);
    }
  }

  drawFromGridID(id: number, color: string): void {
    // Verify that the id is valid
    // if (id < 0 || id >= this.tileNumberX * this.tileNumberY) {
    //   console.log('Invalid grid id', id);
    //   return;
    // }
    // console.log('drawFromGridID', id, color);

    // Draw the pixel
    const x = id % this.tileNumberX;
    const y = Math.floor(id / this.tileNumberX);
    this.drawFromGrid(x, y, color);
  }

  drawFromGrid(x: number, y: number, color: string): void {
    // Verify that the x and y are valid
    // if (x < 0 || x >= this.tileNumberX || y < 0 || y >= this.tileNumberY) {
    //   console.log('Invalid grid coordinates', x, y);
    //   return;
    // }
    // Draw the pixel
    this.context.fillStyle = color;
    this.context.fillRect(x * this.tileSizeX, y * this.tileSizeY, this.tileSizeX, this.tileSizeY);
  }

  sendMessage(event: string, messageObject: any): void {
    // this.websocketService.sendMessage(event, messageObject);
    this.websocketService.sendMessage(event, messageObject);
  }

  setColor(color: string): void {
    this.selectedPixelColor = color;
  }
  selectPixelsForDeletion(): void {
    this.deleteMode = true;
    this.selectedPixels = [];
    console.log('this.deleteMode', this.deleteMode)
  }

  setDrawMode(): void {
    this.deleteMode = false;
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
    if (this.isDrawing && this.password === 'skyorange') {
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

  // draw(x: number, y: number, color: string = this.selectedPixelColor, emit: boolean = true, isOwner: boolean = true): void {

  //   console.log('draw', x, y);
  checkPassword() {
    let  response = false;
    this.http.post<any>('https://roskildepixel.dk/' + 'api/check_password', {password: this.password}).subscribe(data => {
      console.log('check password', data);
      if (data.message === this.password){
        this.correctPassword = this.password;
        response =  true;
      }
      response =  false;
    })
    return response;
  }
  draw(x: number, y: number, color: string = this.selectedPixelColor, emit: boolean = true, isOwner: boolean = true) {

    if(this.pixelsLeft <= 0){
      if(this.isAdmin || this.isTvView){
          if(this.password !== 'skyorange'){
              return
          }
      }else{
        this.toastr.error('Wait ' + this.displayTime,'Exhausted all pixels!',{positionClass:'toast-bottom-center',toastClass: 'toastClassFont ngx-toastr'});
      return}
    }

    const canvasElement = this.canvas.nativeElement;
    const rect = canvasElement.getBoundingClientRect();
    console.log('rect.left rect.top', rect.left, rect.top)
    this.rectCoordinates = "" + rect.left + " ||" + rect.top
    console.log('unscaled coordinates', x, y)
    this.unscaledCoordinates = "x:" + x + " y:" + y

    console.log('drawable coordinates', x - rect.left, y - rect.top)


    let canvasPositionX = x - rect.left;
    let canvasPositionY = y - rect.top;

    // Avoid painting outside the canvas
    if (canvasPositionX < 0 || canvasPositionX >= this.canvasWidth || canvasPositionY < 0 || canvasPositionY >= this.canvasHeight) {
      return;
    }

    let canvasX = Math.floor(canvasPositionX / this.tileSizeX);
    let canvasY = Math.floor(canvasPositionY / this.tileSizeY);

    this.pixelID = canvasX + canvasY * this.tileNumberX;

    console.log('draw', x, y);
    console.log('Canvas position', canvasPositionX, canvasPositionY);

    this.context.fillStyle = this.selectedPixelColor;

    this.context.fillRect(canvasX * this.tileSizeX, canvasY * this.tileSizeY, this.tileSizeX, this.tileSizeY);
    console.log('PixelID', this.pixelID);
    console.log('Color', color);

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
      if(!this.isAdmin){     
      this.sendMessage('draw', { pixelID: this.pixelID, color: this.selectedPixelColor, userID: this.userID });}
      else if (!this.deleteMode && this.isAdmin){} {
        this.sendMessage('draw', { pixelID: this.pixelID, color: this.selectedPixelColor, userID: this.userID });
      }
    } 
    
    if (isOwner) {
      this.pixelsLeft -= 1;
      if (this.pixelsLeft === this.totalAllowedPixels-1) {
        this.startTimer();
      }
    }
    if (this.deleteMode && this.isAdmin) {
      if (this.selectedPixels.length == 1) {
        this.selectedPixels.push(this.pixelID)
        this.sendPixelsForDeletion(this.selectedPixels)
      } else {
        this.selectedPixels.push(this.pixelID)
      }
    }
  }

  closeWelcomeMessage() {
    this.isFirstTimeUser = false;
  }
  sendPixelsForDeletion(selectedPixels: any[]) {
    const firstPixel = selectedPixels[0]
    const secondPixel = selectedPixels[1]

    const row1 = Math.floor(firstPixel / 200);
    const col1 = firstPixel % 200;
    const row2 = Math.floor(secondPixel / 200);
    const col2 = secondPixel % 200;

    const topLeftRow = Math.min(row1, row2);
    const topLeftCol = Math.min(col1, col2);
    const bottomRightRow = Math.max(row1, row2);
    const bottomRightCol = Math.max(col1, col2);

    const pixelIds = [];
    for (let row = topLeftRow; row <= bottomRightRow; row++) {
      for (let col = topLeftCol; col <= bottomRightCol; col++) {
        const pixelId = row * 200 + col;
        pixelIds.push(pixelId);
      }
    }
    console.log('pixelIds', pixelIds)
    this.selectedPixels = [];
    const data = { password: this.password, pixel_ids: pixelIds }
    this.http.post<any>('https://roskildepixel.dk/'+'api/delete_pixels', data).subscribe(data => {
      console.log('delete', data);
    }, error => {
      console.log('delete error', error)
    })
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
