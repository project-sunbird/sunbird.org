import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-editemail',
  templateUrl: './editemail.component.html',
  styleUrls: ['./editemail.component.scss']
})
export class EditemailComponent implements OnInit {
  showContactPopup = false;
  contactType = 'email';
  constructor() {}

  ngOnInit() {}
  editEmail() {
    console.log('clicked');
    this.showContactPopup = true;
  }
}
