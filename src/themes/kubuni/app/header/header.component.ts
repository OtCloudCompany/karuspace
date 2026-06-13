import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { ContextHelpToggleComponent } from '../../../../app/header/context-help-toggle/context-help-toggle.component';
import { HeaderComponent as BaseComponent } from '../../../../app/header/header.component';
import { ThemedAuthNavMenuComponent } from '../../../../app/shared/auth-nav-menu/themed-auth-nav-menu.component';
import { ImpersonateNavbarComponent } from '../../../../app/shared/impersonate-navbar/impersonate-navbar.component';
import { TopNavBarComponent } from "./top-nav-bar/top-nav-bar.component";
import { ThemedNavbarComponent } from "src/app/navbar/themed-navbar.component";

@Component({
  selector: 'ds-themed-header',
  // styleUrls: ['header.component.scss'],
  styleUrls: ['../../../../app/header/header.component.scss'],
  templateUrl: 'header.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    ContextHelpToggleComponent,
    ImpersonateNavbarComponent,
    NgbDropdownModule,
    RouterLink,
    ThemedAuthNavMenuComponent,
    TranslateModule,
    TopNavBarComponent,
    ThemedNavbarComponent,
    ThemedNavbarComponent
],
})
export class HeaderComponent extends BaseComponent {
}
