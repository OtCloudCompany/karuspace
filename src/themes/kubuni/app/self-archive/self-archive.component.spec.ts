import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelfArchiveComponent } from './self-archive.component';

describe('SelfArchiveComponent', () => {
  let component: SelfArchiveComponent;
  let fixture: ComponentFixture<SelfArchiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelfArchiveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelfArchiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
