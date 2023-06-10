import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  constructor(private socket: Socket) { }
  
  connect() {
    this.socket.connect();
  }

  sendMessage(event:string, messageObject: any) {
    this.socket.emit(event, messageObject);
  }

  onMessage() {
    return this.socket.fromEvent('message').pipe(map((data) => data));
  }
  
  onDraw() {
    return this.socket.fromEvent('draw').pipe(map((data) => data));
  }
}
