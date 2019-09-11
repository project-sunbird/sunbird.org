import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import * as  iziModal from 'izimodal/js/iziModal';
import { NavigationHelperService, ResourceService, ToasterService, ConfigService, IUserProfile, ServerResponse } from '@sunbird/shared';
import { TelemetryService, IInteractEventEdata } from '@sunbird/telemetry';
import { combineLatest, of, throwError } from 'rxjs';
import { UserService, TenantService, AssetService } from '@sunbird/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@sunbird/environment';
import { SpaceEditorService, MyassetsService } from '../../services';
import { tap, delay, map, first } from 'rxjs/operators';
import * as _ from 'lodash-es';
jQuery.fn.iziModal = iziModal;

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, OnDestroy {

  private userProfile: IUserProfile;
  private routeParams: any;
  private buildNumber: string;
  private deviceId: string;
  private portalVersion: string;
  public logo: string;
  public showLoader = true;
  private browserBackEventSub;
  public extContWhitelistedDomains: string;
  public ownershipType: Array<string>;
  public queryParams: object;
  public contentDetails: any;
  public videoMaxSize: any;

  constructor(private userService: UserService, public _zone: NgZone, private activatedRoute: ActivatedRoute,
    private tenantService: TenantService, private telemetryService: TelemetryService, private router: Router,
    private navigationHelperService: NavigationHelperService, public workspaceService: MyassetsService,
    private configService: ConfigService, private editorService: SpaceEditorService, private toasterService: ToasterService,
    private resourceService: ResourceService, public assetService: AssetService) {
    const buildNumber = (<HTMLInputElement>document.getElementById('buildNumber'));
    this.buildNumber = buildNumber ? buildNumber.value : '1.0';
    const deviceId = (<HTMLInputElement>document.getElementById('deviceId'));
    this.deviceId = deviceId ? deviceId.value : '';
    this.portalVersion = buildNumber && buildNumber.value ? buildNumber.value.slice(0, buildNumber.value.lastIndexOf('.')) : '1.0';
    this.extContWhitelistedDomains = (<HTMLInputElement>document.getElementById('extContWhitelistedDomains')) ?
      (<HTMLInputElement>document.getElementById('extContWhitelistedDomains')).value : 'youtube.com,youtu.be';
    this.videoMaxSize = (<HTMLInputElement>document.getElementById('videoMaxSize')) ?
      (<HTMLInputElement>document.getElementById('videoMaxSize')).value : '100';
  }
  ngOnInit() {
    this.userProfile = this.userService.userProfile;
    this.routeParams = this.activatedRoute.snapshot.params;
    this.queryParams = this.activatedRoute.snapshot.queryParams;
    this.disableBrowserBackButton();
    this.getDetails().pipe(first(),
      tap(data => {
        if (data.tenantDetails) {
          this.logo = data.tenantDetails.logo;
        }
        this.ownershipType = data.ownershipType;
        this.showLoader = false;
        this.initEditor();
        this.setWindowContext();
        this.setWindowConfig();
      }),
      delay(10)) // wait for iziModal lo load
      .subscribe((data) => {
        jQuery('#genericEditor').iziModal('open');
      },
        (error) => {
          if (error === 'NO_PERMISSION') {
            this.toasterService.error(this.resourceService.messages.emsg.m0013);
          } else if (['RESOURCE_SELF_LOCKED', 'RESOURCE_LOCKED'].includes(_.get(error, 'error.params.err'))) {
            this.toasterService.error(_.replace(error.error.params.errmsg, 'resource', 'content'));
          } else {
            this.toasterService.error(this.resourceService.messages.emsg.m0004);
          }
          this.closeModal();
        }
      );
  }
  private getDetails() {
    const lockInfo = _.pick(this.queryParams, 'lockKey', 'expiresAt', 'expiresIn');
    const allowedEditState = ['draft', 'allcontent', 'collaborating-on', 'uploaded'].includes(this.routeParams.state);
    const allowedEditStatus = this.routeParams.contentStatus ? ['draft'].includes(this.routeParams.contentStatus.toLowerCase()) : false;
    if (_.isEmpty(lockInfo) && allowedEditState && allowedEditStatus) {
      return combineLatest(this.tenantService.tenantData$, this.getContentDetails(),
      this.editorService.getOwnershipType(),this.lockContent()).
      pipe(map(data => ({ tenantDetails: data[0].tenantData,
        collectionDetails: data[1], ownershipType: data[2] })));
    } else {
      return combineLatest(this.tenantService.tenantData$, this.getContentDetails(),
      this.editorService.getOwnershipType()).
      pipe(map(data => ({ tenantDetails: data[0].tenantData,
        collectionDetails: data[1], ownershipType: data[2] })));
    }
  }
  private lockContent () {
    const contentInfo = {
      contentType: this.routeParams.type,
      framework: this.routeParams.framework,
      identifier: this.routeParams.contentId
    };
    const input = {
      resourceId : contentInfo.identifier,
      resourceType : 'Content',
      resourceInfo : JSON.stringify(contentInfo),
      creatorInfo : JSON.stringify({'name': this.userService.userProfile.firstName, 'id': this.userService.userProfile.identifier}),
      createdBy : this.userService.userProfile.identifier
    };
    return this.workspaceService.lockContent(input).pipe(tap((data) => {
      this.queryParams = data.result;
      this.router.navigate([], {relativeTo: this.activatedRoute, queryParams: data.result});
    }));
  }
  private getContentDetails() {
    if (this.routeParams.contentId) {
    return this.editorService.getContent(this.routeParams.contentId).
      pipe(map((data) => {
        if (data) {
          this.contentDetails = data.result.content;
          return of(data);
        } else  {
          return throwError(data);
        }
      }));
    } else {
      return of({});
    }
  }
 /* private getContentDetails() {
    if (this.routeParams.contentId) {
      const req = {
        url: `${this.configService.urlConFig.URLS.ASSET.READASSET}/${this.routeParams.contentId}`,
      };
    return this.assetService.read(req).
      pipe(map((data) => {
        if (data) {
          this.contentDetails = data.result.asset;
          return of(data);
        } else  {
          return throwError(data);
        }
      }));
    } else {
      return of({});
    }
  } */
  /**
   *Launch Generic Editor in the modal
   */
  private initEditor() {
    jQuery('#genericEditor').iziModal({
      title: '',
      iframe: true,
      iframeURL: '/thirdparty/editors/generic-editor/index.html?' + this.buildNumber,
      navigateArrows: false,
      fullscreen: true,
      openFullscreen: true,
      closeOnEscape: true,
      overlayClose: false,
      overlay: false,
      overlayColor: '',
      history: false,
      closeButton: true,
      onClosing: () => {
        this._zone.run(() => {
          this.closeModal();
        });
      }
    });
  }
  private setWindowContext() {
    window.context = {
      user: {
        id: this.userService.userid,
        name : !_.isEmpty(this.userProfile.lastName) ? this.userProfile.firstName + ' ' + this.userProfile.lastName :
        this.userProfile.firstName,
        orgIds: this.userProfile.organisationIds,
        organisations: this.userService.orgIdNameMap
      },
      did: this.deviceId,
      sid: this.userService.sessionId,
      contentId: this.routeParams.contentId,
      pdata: {
        id: this.userService.appId,
        ver: this.portalVersion,
        pid: 'sunbird-portal'
      },
      contextRollUp: this.telemetryService.getRollUpData(this.userProfile.organisationIds),
      tags: this.userService.dims,
      channel: this.userService.channel,
      env: 'generic-editor',
      framework: this.routeParams.framework,
      ownershipType: this.ownershipType,
      timeDiff: this.userService.getServerTimeDiff
    };
  }
  private setWindowConfig() {
    window.config = _.cloneDeep(this.configService.editorConfig.GENERIC_EDITOR.WINDOW_CONFIG); // cloneDeep to preserve default config
    window.config.build_number = this.buildNumber;
    window.config.headerLogo = this.logo;
    window.config.lock = _.pick(this.queryParams, 'lockKey', 'expiresAt', 'expiresIn');
    window.config.extContWhitelistedDomains = this.extContWhitelistedDomains;
    window.config.enableTelemetryValidation = environment.enableTelemetryValidation; // telemetry validation
    window.config.videoMaxSize = this.videoMaxSize;
  }
  /**
  * Re directed to the workspace on close of modal
  */
  closeModal() {
    this.showLoader = true;
    if (document.getElementById('genericEditor')) {
      document.getElementById('genericEditor').remove();
    }
    const isContentStatus = _.get(this.routeParams, 'contentStatus');
    if ((isContentStatus && isContentStatus.toLowerCase() === 'draft') ||
  (window.context && window.context.contentId && !isContentStatus)) {
      this.retireLock();
    } else {
      this.redirectToWorkSpace();
    }
  }

  retireLock () {
    const inputData = {'resourceId': this.routeParams.contentId, 'resourceType': 'Content'};
    this.workspaceService.retireLock(inputData).subscribe(
      (data: ServerResponse) => {
        this.redirectToWorkSpace();
      },
      (err: ServerResponse) => {
        console.log('err in retire lock = ', err);
        // this.redirectToWorkSpace();
        this.toasterService.error('Something went wrong');
      }
    );
  }

  redirectToWorkSpace () {
    this.toasterService.success('Asset created successfully');
   setTimeout(() => {
    this.navigationHelperService.navigateToWorkSpace('/myassets');
   }, 1700);
  }

  private disableBrowserBackButton() {
    sessionStorage.setItem('inEditor', 'true');
    window.location.hash = 'no';
    this.workspaceService.toggleWarning(this.routeParams.type);
    this.browserBackEventSub = this.workspaceService.browserBackEvent.subscribe(() => {
      const closeEditorIntractEdata: IInteractEventEdata = {
        id: 'browser-back-button',
        type: 'click',
        pageid: 'generic-editor'
      };
      this.generateInteractEvent(closeEditorIntractEdata);
    });
  }
  private generateInteractEvent(intractEdata) {
    if (intractEdata) {
      const appTelemetryInteractData: any = {
        context: {
          env: 'generic-editor'
        },
        edata: intractEdata
      };
      if (this.routeParams.contentId) {
        appTelemetryInteractData.object = {
          id: this.routeParams.contentId,
          type: 'content',
          ver: '1.0'
        };
      }
      this.telemetryService.interact(appTelemetryInteractData);
    }
  }
  ngOnDestroy() {
    if (document.getElementById('genericEditor')) {
      document.getElementById('genericEditor').remove();
    }
    if (this.browserBackEventSub) {
      this.browserBackEventSub.unsubscribe();
    }
    sessionStorage.setItem('inEditor', 'false');
    this.workspaceService.toggleWarning();
  }
}
