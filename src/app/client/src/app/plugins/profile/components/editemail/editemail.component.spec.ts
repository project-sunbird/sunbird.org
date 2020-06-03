import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditemailComponent } from './editemail.component';

describe('EditemailComponent', () => {
  let component: EditemailComponent;
  let fixture: ComponentFixture<EditemailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditemailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditemailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
