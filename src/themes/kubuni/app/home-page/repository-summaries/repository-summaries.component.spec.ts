import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepositorySummariesComponent } from './repository-summaries.component';

describe('RepositorySummariesComponent', () => {
  let component: RepositorySummariesComponent;
  let fixture: ComponentFixture<RepositorySummariesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepositorySummariesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepositorySummariesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
