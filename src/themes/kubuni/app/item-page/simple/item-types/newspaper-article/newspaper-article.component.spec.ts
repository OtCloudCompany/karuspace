import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewspaperArticleComponent } from './newspaper-article.component';

describe('NewspaperArticleComponent', () => {
  let component: NewspaperArticleComponent;
  let fixture: ComponentFixture<NewspaperArticleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewspaperArticleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewspaperArticleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
