import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCanvasComponent } from './admin-canvas.component';

describe('AdminCanvasComponent', () => {
  let component: AdminCanvasComponent;
  let fixture: ComponentFixture<AdminCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminCanvasComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
