import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraduationBookletComponent } from './graduation-booklet.component';

describe('GraduationBookletComponent', () => {
  let component: GraduationBookletComponent;
  let fixture: ComponentFixture<GraduationBookletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraduationBookletComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraduationBookletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
