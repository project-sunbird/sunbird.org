import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpaceViewAllComponent } from './space-view-all.component';

describe('SpaceViewAllComponent', () => {
  let component: SpaceViewAllComponent;
  let fixture: ComponentFixture<SpaceViewAllComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpaceViewAllComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceViewAllComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
