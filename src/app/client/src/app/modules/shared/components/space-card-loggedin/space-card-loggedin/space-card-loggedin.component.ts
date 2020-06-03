import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ICard } from '../../../interfaces';
import { Router } from '@angular/router';

@Component({
  selector: 'app-space-card-loggedin',
  templateUrl: './space-card-loggedin.component.html',
  styleUrls: ['./space-card-loggedin.component.scss']
})
export class SpaceCardLoggedinComponent implements OnInit {
  @Input() slug: string;
  @Input() data: ICard;
  @Input() customClass: string;
  @Output() clickEvent = new EventEmitter<any>();
  url: any;
keywordsString='';
  constructor(public router: Router) { }

  ngOnInit() {
    if(this.data['keywords'] && this.data['keywords'].length > 0) {

      this.keywordsString = '';
      this.data['keywords'].forEach(element => {
    this.keywordsString = this.keywordsString + element + ',';
    });
  }
  }
  public onAction(data, action, event, link) {
    this.url = link;
      // console.log('content in space cards = ', data, action, event, this.url.slice(0, 5));
       // if(this.slug !== 'space' && !(this.userService.loggedIn)){

         if (event.target.id === 'link') {
           if ( this.url.slice(0, 4) === 'http') {
            window.open(link);
           } else {
            window.open('http://' + link);
           }
         } else {
           this.router.navigate(['space/shared/details/content/', data.identifier]);
       // this.clickEvent.emit({ 'action': action, 'data': data });
         }
       // } else {
       //   if (this.slug === 'space') {
       // this.router.navigate(['resources/player/content/', data.identifier]);
       //   }
       // }
     }
}