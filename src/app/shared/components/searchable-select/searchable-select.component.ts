import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideChevronDown, LucideX } from '@lucide/angular';

export interface SelectOption {
  value: any;
  label: string;
  sublabel?: string;
}

function removeAccents(str: string): string {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

@Component({
  selector: 'emervet-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideChevronDown, LucideX],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true
    }
  ],
  template: `
    <div
      class="searchable-select"
      [class.searchable-select--open]="isOpen"
      [class.searchable-select--disabled]="disabled"
    >
      <div class="searchable-select__control">
        <input
          #inputEl
          type="text"
          class="searchable-select__input"
          [placeholder]="computedPlaceholder"
          [value]="computedInputValue"
          [disabled]="disabled"
          (focus)="onInputFocus()"
          (input)="onInputChange($event)"
          (keydown.arrowdown)="openDropdown()"
          (keydown.escape)="closeDropdown()"
          autocomplete="off"
        />

        <div class="searchable-select__icons">
          <button
            *ngIf="value && allowClear && !disabled"
            type="button"
            class="searchable-select__clear"
            (mousedown)="clearSelection($event)"
            title="Limpiar"
          >
            <svg lucideX aria-hidden="true"></svg>
          </button>
          <svg
            lucideChevronDown
            class="searchable-select__arrow"
            (mousedown)="toggleOpen($event)"
            aria-hidden="true"
          ></svg>
        </div>
      </div>

      <div class="searchable-select__dropdown" *ngIf="isOpen" (mousedown)="$event.preventDefault()">
        <ul class="searchable-select__options">
          <li
            *ngFor="let opt of filteredOptions"
            class="searchable-select__option"
            [class.searchable-select__option--selected]="isSelected(opt)"
            (mousedown)="selectOption(opt, $event)"
          >
            <span class="option-label">{{ opt.label }}</span>
            <span *ngIf="opt.sublabel" class="option-sublabel">{{ opt.sublabel }}</span>
          </li>
          <li *ngIf="filteredOptions.length === 0" class="searchable-select__no-results">
            No se encontraron opciones
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      position: relative;
    }

    .searchable-select {
      position: relative;
      width: 100%;
      font-family: inherit;
    }

    .searchable-select--disabled {
      opacity: 0.65;
      pointer-events: none;
    }

    .searchable-select__control {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 40px;
      padding: 0 8px 0 12px;
      background: #ffffff;
      border: 1px solid #c5d1d4;
      border-radius: 10px;
      box-sizing: border-box;
      transition: all 0.15s ease;
    }

    .searchable-select__control:hover {
      border-color: #103f45;
    }

    .searchable-select--open .searchable-select__control {
      border-color: #103f45;
      box-shadow: 0 0 0 2px rgba(16, 63, 69, 0.15);
    }

    .searchable-select__input {
      width: 100%;
      height: 100%;
      border: 0;
      background: transparent;
      outline: none;
      font-size: 0.92rem;
      color: #203b40;
      font-family: inherit;
      cursor: text;

      &::placeholder {
        color: #9ca3af;
      }
    }

    .searchable-select__icons {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #64748b;
      flex-shrink: 0;
    }

    .searchable-select__clear {
      border: 0;
      background: transparent;
      padding: 2px;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      border-radius: 4px;

      &:hover {
        color: #ef4444;
        background: #fef2f2;
      }

      svg {
        width: 14px;
        height: 14px;
      }
    }

    .searchable-select__arrow {
      width: 16px;
      height: 16px;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .searchable-select--open .searchable-select__arrow {
      transform: rotate(180deg);
    }

    .searchable-select__dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      z-index: 10000;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      animation: dropdownFadeIn 0.15s ease-in-out;
    }

    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .searchable-select__options {
      list-style: none;
      margin: 0;
      padding: 4px 0;
      max-height: 200px;
      overflow-y: auto;
    }

    .searchable-select__option {
      padding: 8px 14px;
      font-size: 0.9rem;
      color: #334155;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 2px;
      user-select: none;

      &:hover {
        background: #f1f5f9;
        color: #0f172a;
      }

      &.searchable-select__option--selected {
        background: #e6f4f2;
        color: #103f45;
        font-weight: 600;
      }
    }

    .option-label {
      font-size: 0.9rem;
    }

    .option-sublabel {
      font-size: 0.76rem;
      color: #64748b;
    }

    .searchable-select__no-results {
      padding: 12px;
      text-align: center;
      font-size: 0.85rem;
      color: #94a3b8;
    }
  `]
})
export class SearchableSelectComponent implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef);
  @ViewChild('inputEl') inputEl!: ElementRef<HTMLInputElement>;

  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Seleccione...';
  @Input() disabled: boolean = false;
  @Input() allowClear: boolean = true;

  @Output() valueChange = new EventEmitter<any>();

  protected isOpen = false;
  protected filterText = '';
  protected value: any = null;

  protected onChange: (val: any) => void = () => {};
  protected onTouched: () => void = () => {};

  get selectedOption(): SelectOption | undefined {
    if (this.value === null || this.value === undefined || this.value === '') return undefined;
    return this.options.find((opt) => String(opt.value) === String(this.value));
  }

  get computedPlaceholder(): string {
    if (this.isOpen && this.selectedOption) {
      return this.selectedOption.label;
    }
    return this.placeholder;
  }

  get computedInputValue(): string {
    if (this.isOpen) {
      return this.filterText;
    }
    return this.selectedOption ? this.selectedOption.label : '';
  }

  get filteredOptions(): SelectOption[] {
    if (!this.filterText.trim()) {
      return this.options;
    }
    const q = removeAccents(this.filterText.trim());
    return this.options.filter(
      (opt) => removeAccents(opt.label).includes(q) || (opt.sublabel && removeAccents(opt.sublabel).includes(q))
    );
  }

  protected onInputFocus(): void {
    if (this.disabled) return;
    this.isOpen = true;
    this.filterText = '';
  }

  protected onInputChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.filterText = val;
    this.isOpen = true;

    // Si el usuario vacía el filtro y presiona la tecla o borra, o si coincide exactamente con una opción
    if (!val.trim()) {
      this.value = null;
      this.onChange(null);
      this.valueChange.emit(null);
    } else {
      const cleanVal = removeAccents(val.trim());
      const match = this.options.find((opt) => removeAccents(opt.label) === cleanVal);
      if (match) {
        this.value = match.value;
        this.onChange(this.value);
        this.valueChange.emit(this.value);
      }
    }
  }

  protected toggleOpen(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (this.disabled) return;

    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  protected openDropdown(): void {
    this.isOpen = true;
    this.filterText = '';
    if (this.inputEl) {
      this.inputEl.nativeElement.focus();
    }
  }

  protected closeDropdown(): void {
    this.isOpen = false;
    this.filterText = '';
    this.onTouched();
  }

  protected selectOption(opt: SelectOption, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.value = opt.value;
    this.filterText = '';
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.isOpen = false;
    this.onTouched();
  }

  protected clearSelection(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.value = null;
    this.filterText = '';
    this.onChange(null);
    this.valueChange.emit(null);
    this.isOpen = false;
    this.onTouched();
  }

  protected isSelected(opt: SelectOption): boolean {
    if (this.value === null || this.value === undefined || this.value === '') return false;
    return String(opt.value) === String(this.value);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isOpen) {
        this.closeDropdown();
      }
    }
  }

  // --- ControlValueAccessor Methods ---
  writeValue(val: any): void {
    this.value = val;
    this.filterText = '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
