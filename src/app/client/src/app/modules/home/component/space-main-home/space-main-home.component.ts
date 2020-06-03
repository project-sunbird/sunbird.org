import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionLike as ISubscription } from 'rxjs';
import { CoursesService, UserService, PlayerService, PermissionService } from '@sunbird/core';
import { ResourceService, ToasterService, ServerResponse, ConfigService, UtilService, IUserData } from '@sunbird/shared';
import { IInteractEventObject, IInteractEventEdata, IImpressionEventInput } from '@sunbird/telemetry';
import * as _ from 'lodash-es';
// import { IUserData } from '../../../shared';
// import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-space-main-home',
  templateUrl: './space-main-home.component.html',
  styleUrls: ['./space-main-home.component.scss']
})
export class SpaceMainHomeComponent implements OnInit, OnDestroy {
  public contents = [
    {
      role: 'CONTENT_CREATOR',
      data: [ 'As a Content Creator, you can do the following:',
      // tslint:disable-next-line:max-line-length
      ' - Search and discover assets',
       // tslint:disable-next-line:max-line-length
      ' - Add a new asset',

      '- Edit / delete an existing asset'
     ]
    },
    {
     role: 'CONTENT_REVIEWER',
     data: [
       'As a Content Reviewer, you can do the following:',
        // tslint:disable-next-line:max-line-length
        '- Search and discover assets',

        '- Review and publish/reject an asset'
             ]
   },
   {
     role: 'ORG_ADMIN',
     data: [
       'As a Organization Admin, you can use the SPace to accomplish the following:',
        // tslint:disable-next-line:max-line-length
       '- Search and Discover Assets: You can discover assets - Knowledge, Process, Software, Hardware, Data - that you would like to leverage for your Mission. Go to Shared Assets.',
       '- Add User: You can add users and assign required roles to a specific user. Go to Add User.'
     ]
   },
   {
     role: 'TEACHER_BADGE_ISSUER',
     data: [
       'As a Badge Issuer, you can use the SPace to accomplish the following:',
        // tslint:disable-next-line:max-line-length
       '- Search, Discover and Badge Assets: You can discover assets - Knowledge, Process, Software, Hardware, Data - that you would like to Badge. Go to Shared Assets.',
            ]
   },
   ];
  /**
  * inviewLogs
 */
  inviewLogs = [];
  /**
	 * telemetryImpression
	*/
  telemetryImpression: IImpressionEventInput;
  /**
	 * telemetryInteractObject
	*/
  telemetryInteractObject: IInteractEventObject;
  courseSubscription: ISubscription;
  userSubscription: ISubscription;
  /**
   * To navigate to other pages
   */
  route: Router;

  /**
   * To send activatedRoute.snapshot to router navigation
   * service for redirection to parent component
   */
  private activatedRoute: ActivatedRoute;
  /**
   * To get user details.
   */
  private userService: UserService;
  /**
   * To get enrolled courses details.
   */
  public courseService: CoursesService;
  /**
   * To call resource service which helps to use language constant.
   */
  public resourceService: ResourceService;
  /**
   * To show toaster(error, success etc) after any API calls.
   */
  private toasterService: ToasterService;

  public utilService: UtilService;
  /**
   * Contains details of userprofile and enrolled courses.
   */
  toDoList: Array<object> = [];
  /**
  * Contains config service reference
  */
  public configService: ConfigService;
  /**
   * This variable hepls to show and hide page loader.
   * It is kept true by default as at first when we comes
   * to a page the loader should be displayed before showing
   * any data
   */
  showLoader = true;
  /**
  * Slider setting to display number of cards on the slider.
  */
  slideConfig = {
    'slidesToShow': 4,
    'slidesToScroll': 4,
    'responsive': [
      {
        'breakpoint': 2800,
        'settings': {
          'slidesToShow': 6,
          'slidesToScroll': 6
        }
      },
      {
        'breakpoint': 2200,
        'settings': {
          'slidesToShow': 5,
          'slidesToScroll': 5
        }
      },
      {
        'breakpoint': 2000,
        'settings': {
          'slidesToShow': 4,
          'slidesToScroll': 4
        }
      },
      {
        'breakpoint': 1600,
        'settings': {
          'slidesToShow': 3.5,
          'slidesToScroll': 3
        }
      },
      {
        'breakpoint': 1200,
        'settings': {
          'slidesToShow': 3,
          'slidesToScroll': 3
        }
      },
      {
        'breakpoint': 900,
        'settings': {
          'slidesToShow': 2.5,
          'slidesToScroll': 2
        }
      },
      {
        'breakpoint': 750,
        'settings': {
          'slidesToShow': 2,
          'slidesToScroll': 2
        }
      },
      {
        'breakpoint': 660,
        'settings': {
          'slidesToShow': 1.75,
          'slidesToScroll': 1
        }
      },
      {
        'breakpoint': 530,
        'settings': {
          'slidesToShow': 1.25,
          'slidesToScroll': 1
        }
      },
      {
        'breakpoint': 450,
        'settings': {
          'slidesToShow': 1,
          'slidesToScroll': 1
        }
      }
    ],
    infinite: false
  };
  /**The button clicked value for interact telemetry event */
  btnArrow: string;

 workSpaceRole: Array<string>;
 public userContents = [];
 userlogged;
 images = [1, 2, 3].map(() => `../../.../../../../../assets/images/spacebannernew.jpg${Math.random()}`);
 public permissionService: PermissionService;
 showNavigationArrows = false;
 showNavigationIndicators = false;
 userRole: any;
  /**
   * The "constructor"
   *
   * @param {ResourceService} resourceService Reference of resourceService.
   * @param {UserService} userService Reference of userService.
   * @param {CoursesService} courseService  Reference of courseService.
   * @param {ToasterService} iziToast Reference of toasterService.
   */
  constructor(resourceService: ResourceService, private playerService: PlayerService,
    courseService: CoursesService, toasterService: ToasterService,
    route: Router, activatedRoute: ActivatedRoute, utilService: UtilService,
    userService: UserService , permissionService: PermissionService,
   configService: ConfigService
    ) {
    this.userService = userService;
    this.courseService = courseService;
    this.resourceService = resourceService;
    this.toasterService = toasterService;
    this.route = route;
    this.activatedRoute = activatedRoute;
    this.configService = configService;
    this.utilService = utilService;
    this.btnArrow = 'prev-button';
    this.configService = configService;
    this.userService = userService;
    this.permissionService = permissionService;
    this.workSpaceRole = this.configService.rolesConfig.headerDropdownRoles.workSpaceRole;
  }
  /**
   * This method calls the course API.
   */
  ngOnInit() {
    // this.populateUserProfile();
    this.getUserRoles();

    this.populateEnrolledCourse();
    this.telemetryImpression = {
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
        uri: this.activatedRoute.snapshot.data.telemetry.uri,
        subtype: this.activatedRoute.snapshot.data.telemetry.subtype
      }
    };
  }
  public populateEnrolledCourse() {
    this.courseSubscription = this.courseService.enrolledCourseData$.subscribe(
      data => {
        if (data && !data.err) {
          this.showLoader = false;
          const constantData = this.configService.appConfig.Home.enrolledCourses.constantData;
          const metaData = { metaData: this.configService.appConfig.Home.enrolledCourses.metaData };
          const dynamicFields = {
            'maxCount': this.configService.appConfig.Home.enrolledCourses.maxCount,
            'progress': this.configService.appConfig.Home.enrolledCourses.progress
          };
          const courses = this.utilService.getDataForCard(data.enrolledCourses,
            constantData, dynamicFields, metaData);
          this.toDoList = this.toDoList.concat(courses);
        } else if (data && data.err) {
          this.showLoader = false;
          this.toasterService.error(this.resourceService.messages.fmsg.m0001);
        }
      },
    );
    this.setInteractEventData();
  }
  /**
   * Used to dispaly profile as a first element.
   *@param {number} index Give position for current entry
   *@param {number} item  Give postion
   */
  trackByFn(index, item) {
    return index;
  }

  playContent(event) {
    if (event.data.metaData.batchId) {
      event.data.metaData.mimeType = 'application/vnd.ekstep.content-collection';
      event.data.metaData.contentType = 'Course';
    }
    this.playerService.playContent(event.data.metaData);
  }
  /**
  *This method calls the populateUserProfile and populateCourse to show
  * user details and enrolled courses.
  */




getUserRoles() {
this.userService.userData$.subscribe(
   (user: IUserData) => {
     if (user && !user.err) {
       this.userRole = user.userProfile.userRoles;
     }
   });
   this.getContent();

}
getContent() {
 this.userRole.forEach(element => {
    // tslint:disable-next-line:max-line-length
         if (element === 'CONTENT_CREATOR' || element === 'CONTENT_REVIEWER' || element === 'ORG_ADMIN' || element === 'TEACHER_BADGE_ISSUER') {
           _.forEach(this.contents, content => {
             if (element === content.role) {
               this.userContents.push(content.data);
             }
           });
         }
       });
}


  /**
   *ngOnDestroy unsubscribe the subscription
   */
  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.courseSubscription) {
      this.courseSubscription.unsubscribe();
    }
  }

  /**
   * get inview  Data
  */
  inview(event) {
    _.forEach(event.inview, (inview, key) => {
      const obj = _.find(this.inviewLogs, (o) => {
        if (inview.data.type !== 'profile') {
          return o.objid === inview.data.courseId;
        } else {
          return o.objid === this.userService.userid;
        }
      });
      if (obj === undefined) {
        this.inviewLogs.push({
          objid: inview.data.courseId || this.userService.userid,
          objtype: 'home',
          index: inview.id,
          section: 'ToDo',
        });
      }
    });
    this.telemetryImpression.edata.visits = this.inviewLogs;
    this.telemetryImpression.edata.subtype = 'pageexit';
    this.telemetryImpression = Object.assign({}, this.telemetryImpression);
  }
  /**
   * get inviewChange
  */
  inviewChange(toDoList, event) {
    const slideData = toDoList.slice(event.currentSlide + 1, event.currentSlide + 5);
    _.forEach(slideData, (slide, key) => {
      const obj = _.find(this.inviewLogs, (o) => {
        return o.objid === slide.courseId;
      });
      if (obj === undefined) {
        this.inviewLogs.push({
          objid: slide.courseId,
          objtype: 'home',
          index: event.currentSlide + key,
          section: 'ToDo'
        });
      }
    });
    this.telemetryImpression.edata.visits = this.inviewLogs;
    this.telemetryImpression.edata.subtype = 'pageexit';
    this.telemetryImpression = Object.assign({}, this.telemetryImpression);
  }
  checkSlide(event) {
    if (event.currentSlide === 0 && event.nextSlide === 0) {
      this.btnArrow = 'prev-button';
    } else if (event.currentSlide < event.nextSlide) {
      this.btnArrow = 'next-button';
    } else if (event.currentSlide > event.nextSlide) {
      this.btnArrow = 'prev-button';
    }
  }
  public anouncementInview(event) {
    if (event) {
      _.forEach(event.inview, (inview, key) => {
        const obj = _.find(this.inviewLogs, (o) => {
          return o.objid === inview.data.id;
        });
        if (obj === undefined) {
          this.inviewLogs.push({
            objid: inview.data.id,
            objtype: 'announcement',
            index: inview.id,
            section: 'ToDo',
          });
        }
      });
      this.telemetryImpression.edata.visits = this.inviewLogs;
      this.telemetryImpression.edata.subtype = 'pageexit';
    }
  }
  setInteractEventData() {
    this.telemetryInteractObject =  {
      id: this.userService.userid,
      type: 'user',
      ver: '1.0'
    };
  }
}
