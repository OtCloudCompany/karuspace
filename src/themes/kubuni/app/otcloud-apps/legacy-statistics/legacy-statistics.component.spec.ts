import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegacyStatisticsComponent } from './legacy-statistics.component';

describe('LegacyStatisticsComponent', () => {
  let component: LegacyStatisticsComponent;
  let fixture: ComponentFixture<LegacyStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegacyStatisticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LegacyStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
