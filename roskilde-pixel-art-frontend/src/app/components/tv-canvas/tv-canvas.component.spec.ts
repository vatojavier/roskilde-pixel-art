import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TvCanvasComponent } from './tv-canvas.component';

describe('TvCanvasComponent', () => {
  let component: TvCanvasComponent;
  let fixture: ComponentFixture<TvCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TvCanvasComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TvCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
