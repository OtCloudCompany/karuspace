import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThesisComponent } from './thesis.component';

describe('ThesisComponent', () => {
  let component: ThesisComponent;
  let fixture: ComponentFixture<ThesisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThesisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThesisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
