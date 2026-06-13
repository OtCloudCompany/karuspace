import { Component } from '@angular/core';
import { ThemedSearchNavbarComponent } from 'src/app/search-navbar/themed-search-navbar.component';

@Component({
  selector: 'ds-top-nav-bar',
  standalone: true,
  imports: [ThemedSearchNavbarComponent],
  templateUrl: './top-nav-bar.component.html',
  styleUrl: './top-nav-bar.component.scss'
})
export class TopNavBarComponent {

}
