import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { InstitutePickerComponent } from './institute-picker.component';

describe('InstitutePickerComponent', () => {
  let component: InstitutePickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstitutePickerComponent, HttpClientTestingModule]
    }).compileComponents();

    component = TestBed.createComponent(InstitutePickerComponent).componentInstance;
    component.institutes.set([
      { id: 1, name: 'HSC JUNIOR COLLEGE', code: 'HSC-001', boardType: 'HSC' },
      { id: 2, name: 'SSC HIGH SCHOOL', code: 'SSC-001', boardType: 'SSC' }
    ]);
  });

  it('filters institutes by selected board type', () => {
    component.boardType = 'SSC';
    component.ngOnChanges({
      boardType: new SimpleChange('HSC', 'SSC', false)
    });

    expect(component.filteredInstitutes()).toEqual([
      jasmine.objectContaining({ id: 2, boardType: 'SSC' })
    ]);
  });

  it('clears selected institute when board type no longer matches', () => {
    spyOn(component.selectedInstituteIdChange, 'emit');
    component.selectedInstituteId = 1;
    component.boardType = 'SSC';

    component.ngOnChanges({
      boardType: new SimpleChange('HSC', 'SSC', false)
    });

    expect(component.selectedInstituteId).toBeNull();
    expect(component.selectedInstituteIdChange.emit).toHaveBeenCalledWith(null);
  });
});
