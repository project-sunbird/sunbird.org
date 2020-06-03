import { ResourceService } from '../../services/index';
import { Component, OnInit, Input, EventEmitter, Output, OnChanges } from '@angular/core';
import { ICard } from '../../interfaces';
import { IImpressionEventInput, IInteractEventObject } from '@sunbird/telemetry';
import {Router} from '@angular/router';
// import { UserService } from '../../../core/services/user/user.service';

@Component({
  selector: 'app-space-card',
  templateUrl: './space-card.component.html',
  styleUrls: ['./space-card.component.scss']
})
export class SpaceCardComponent  {
  @Input() slug: string;
  @Input() data: ICard;
  @Input() customClass: string;
  @Output() clickEvent = new EventEmitter<any>();
  url: string;

  keywordsString='';
  constructor(public resourceService: ResourceService, public router: Router) {
    this.resourceService = resourceService;
  }


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
        this.router.navigate(['space/explore/player/content/', data.identifier]);
    // this.clickEvent.emit({ 'action': action, 'data': data });
      }
    // } else {
    //   if (this.slug === 'space') {
    // this.router.navigate(['resources/player/content/', data.identifier]);
    //   }
    // }
  }

}