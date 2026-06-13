import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'ds-self-archive',
  standalone: true,
  imports: [],
  templateUrl: './self-archive.component.html',
  styleUrl: './self-archive.component.scss'
})
export class SelfArchiveComponent implements OnInit {
  constructor(private titleService: Title) { }
  ngOnInit(): void {
    this.titleService.setTitle('KarUSpace - Self-Archiving Instructions');
  }
}
