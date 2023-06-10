import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainCanvasComponent } from './components/main-canvas/main-canvas.component';

const routes: Routes = [
  { path: '', component: MainCanvasComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
