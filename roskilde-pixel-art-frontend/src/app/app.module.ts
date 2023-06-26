import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainCanvasComponent } from './components/main-canvas/main-canvas.component';
import { SocketIoModule } from 'ngx-socket-io';
import { environment } from 'src/environments/environment';
import { AdminCanvasComponent } from './components/admin-canvas/admin-canvas.component';
import { TvCanvasComponent } from './components/tv-canvas/tv-canvas.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [
    AppComponent,
    MainCanvasComponent,
    AdminCanvasComponent,
    TvCanvasComponent  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    SocketIoModule.forRoot({
      // url: 'https://roskildepixel.dk/', // Replace with your WebSocket server URL
      url: 'http://localhost:5000/',
    }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
