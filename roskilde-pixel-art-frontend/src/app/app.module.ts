import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainCanvasComponent } from './components/main-canvas/main-canvas.component';
import { SocketIoModule } from 'ngx-socket-io';
import { environment } from 'src/environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    MainCanvasComponent  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    SocketIoModule.forRoot({
      url: environment.websocketUrl, // Replace with your WebSocket server URL
    }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
