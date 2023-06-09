import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainCanvasComponent } from './components/main-canvas/main-canvas.component';
import { AdminCanvasComponent } from './components/admin-canvas/admin-canvas.component';
import { TvCanvasComponent } from './components/tv-canvas/tv-canvas.component';


const routes: Routes = [
  { path: '', component: MainCanvasComponent},
  { path: 'admin', component: AdminCanvasComponent},
  { path: 'tv', component: TvCanvasComponent}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
