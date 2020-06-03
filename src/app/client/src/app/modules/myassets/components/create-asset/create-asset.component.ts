import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import {
  ResourceService, ConfigService, ToasterService, ServerResponse, IUserData, IUserProfile, Framework,
  ILoaderMessage, NavigationHelperService
} from '@sunbird/shared';
import { ActivatedRoute, Router } from '@angular/router';
import { SpaceEditorService } from '../../services/space-editor/space-editor.service';
import { SearchService, UserService, FrameworkService, FormService, ContentService, AssetService } from '@sunbird/core';
import * as _ from 'lodash-es';
import { CacheService } from 'ng2-cache-service';
import { DefaultTemplateComponent } from '@sunbird/workspace';
import { IInteractEventInput, IImpressionEventInput } from '@sunbird/telemetry';
import { MyAsset } from '../../classes/myasset';
import { MyassetsService } from '../../services/my-assets/myassets.service';
import { publish } from 'rxjs/operators';

@Component({
  selector: 'app-create-asset',
  templateUrl: './create-asset.component.html',
  styleUrls: ['./create-asset.component.scss']
})
export class CreateAssetComponent extends MyAsset implements OnInit, OnDestroy {
  @ViewChild('formData') formData: DefaultTemplateComponent;
  @ViewChild('modal') modal;

  /**
	 * This variable hepls to show and hide page loader.
   * It is kept true by default as at first when we comes
   * to a page the loader should be displayed before showing
   * any data
	 */
  showLoader = true;
  /**
* To show toaster(error, success etc) after any API calls
*/
  private toasterService: ToasterService;

  /**
* urlString for get url details
*/
  private urlString;
  /**
* contentType is creation type, fected from url
*/
  public contentType = 'studymaterial';
  /**
   * resourceType is resource type
   */
  public resourceType;
  /**
 * userForm name creation
 */
  public creationForm: FormGroup;
  /**
 * userProfile is of type userprofile interface
 */
  public userProfile: IUserProfile;
  /**
* Contains config service reference
*/
  public configService: ConfigService;
  /**
 * To make inbox API calls
 */
  private editorService: SpaceEditorService;
  /**
  * To call resource service which helps to use language constant
  */
  public resourceService: ResourceService;

  public contentService: ContentService;
  /**
 * To call resource service which helps to use language constant
 */
  public userService: UserService;
  /**
 * To send activatedRoute.snapshot to routerNavigationService
 */
  public activatedRoute: ActivatedRoute;
  /**
  * loader message
  */
  loaderMessage: ILoaderMessage;

  public frameworkService: FrameworkService;

  public formService: FormService;

  public formType = 'content';

  public formAction = 'save';

  public getFormFields: any;

  public formFieldProperties: any;

  public categoryMasterList: any;

  public creationFormLable: string;

  public name: string;

  public description: string;

  public isCachedDataExists: boolean;

  public framework: string;

  public contentID: string;

  public formUpdateData: any;
  uploadSuccess = false;
  showMessage = false;
  lockPopupData: object;
  showLockedContentModal = false;
  /**
	* telemetryImpression
	*/
  telemetryImpression: IImpressionEventInput;
  enabled = false;
  pdf: any;
  fileList: any;
  contentId: string;
  content: any;
  state: string;
  enableContent = false;
  enableLink = false;
  uploadedcontent: any;
  updatebtnStatus = false;
  constructor(
    public searchService: SearchService,
    public workSpaceService: MyassetsService,
    activatedRoute: ActivatedRoute,
    frameworkService: FrameworkService,
    private router: Router,
    resourceService: ResourceService,
    toasterService: ToasterService,
    editorService: SpaceEditorService,
    userService: UserService,
    configService: ConfigService,
    formService: FormService,
    private _cacheService: CacheService,
    public navigationHelperService: NavigationHelperService,
    public contentservice: ContentService,
    public assetService: AssetService
  ) {
    super(searchService, workSpaceService, userService);
    this.activatedRoute = activatedRoute;
    this.resourceService = resourceService;
    this.toasterService = toasterService;
    this.editorService = editorService;
    this.userService = userService;
    this.configService = configService;
    this.frameworkService = frameworkService;
    this.formService = formService;
    this.activatedRoute.url.subscribe(url => {
      // this.contentType = url[0].path;


    });

    this.contentService = contentservice;
    this.resourceType = this.configService.appConfig.resourceType[this.contentType];
    this.creationFormLable = this.configService.appConfig.contentCreateTypeLable[this.contentType];
    this.name = this.configService.appConfig.contentName[this.contentType] ?
      this.configService.appConfig.contentName[this.contentType] : 'Untitled';
    this.description = this.configService.appConfig.contentDescription[this.contentType] ?
      this.configService.appConfig.contentDescription[this.contentType] : 'Untitled';
    this.state = 'allcontent';
  }


  ngOnInit() {


    /**
     * fetchFrameworkMetaData is called to config the form data and framework data
     */
    this.fetchFrameworkMetaData();
    /***
 * Call User service to get user data
 */
    this.userService.userData$.subscribe(
      (user: IUserData) => {
        if (user && !user.err) {
          this.userProfile = user.userProfile;
        }
      });
    const req = {
      url: `${this.configService.urlConFig.URLS.CONTENT.GET}/${this.activatedRoute.snapshot.params.contentId}/?mode=edit`,
    };
    this.contentService.get(req).subscribe(data => {
      console.log('read content', data);
      this.content = data.result.content;
      if (data.result.content.artifactUrl && data.result.content.mimeType !== 'video/x-youtube'
        && data.result.content.mimeType !== 'text/x-url') {
        this.enabled = true;
        this.uploadedcontent = data.result.content.artifactUrl.substring(data.result.content.artifactUrl.lastIndexOf('/')).slice(1);

      } else if (data.result.content.mimeType === 'application/vnd.ekstep.ecml-archive') {
        this.enableContent = true;
      } else if(data.result.content.mimeType === 'application/pdf') {
      } else {
        this.enableLink = true;
      }
      // this.formInputData['gradeLevel'] = this.mutateData(data.result.asset.gradeLevel)
      // this.formInputData['versionKey'] = data.result.asset.versionKey;
    });
    this.telemetryImpression = {
      context: {
        env: 'asset-update-page'
      },
      edata: {
        type: 'view',
        pageid: 'asset-update-page',
        uri: this.router.url,
        subtype: 'paginate',
        duration: this.navigationHelperService.getPageLoadTime()
      }
    };
  }
  ngOnDestroy() {
    if (this.modal && this.modal.deny) {
      this.modal.deny();
    }
  }
  /**
  * fetchFrameworkMetaData is gives form config data
  */
  fetchFrameworkMetaData() {

    if (this._cacheService.exists(this.contentType + this.formAction) &&
      this._cacheService.exists('SpaceCategoryMasterListforLiveContentUpdate')) {
      this.categoryMasterList = this._cacheService.get('SpaceCategoryMasterListforLiveContentUpdate');
      this.formFieldProperties = this._cacheService.get(this.contentType + this.formAction);
    }

    this.frameworkService.frameworkData$.subscribe((frameworkData: Framework) => {

      if (!frameworkData.err) {

        this.categoryMasterList = _.cloneDeep(frameworkData.frameworkdata['defaultFramework'].categories);
        this._cacheService.set('SpaceCategoryMasterListforLiveContentUpdate', this.categoryMasterList);
        // this.framework = frameworkData.frameworkdata['defaultFramework'].code;
        /**
  * isCachedDataExists will check data is exists in cache or not. If exists should not call
  * form api otherwise call form api and get form data
  */
        this.isCachedDataExists = this._cacheService.exists(this.contentType + this.formAction);
        if (this.isCachedDataExists) {
          const data: any | null = this._cacheService.get(this.contentType + this.formAction);
          this.formFieldProperties = data;
        } else {
          const formServiceInputParams = {
            formType: this.formType,
            formAction: this.formAction,
            contentType: this.contentType,
            framework: this.framework
          };
          this.formService.getFormConfig(formServiceInputParams).subscribe(
            (data: ServerResponse) => {

              this.formFieldProperties = data;
              this._cacheService.set(this.contentType + this.formAction, this.formFieldProperties);
              this.getFormConfig();
            },
            (err: ServerResponse) => {
              this.toasterService.error(this.resourceService.messages.emsg.m0005);
            }
          );
        }
      } else if (frameworkData && frameworkData.err) {
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
      }
    });

  }

  /**
   * @description            - Which is used to config the form field vlaues
   * @param {formFieldProperties} formFieldProperties  - Field information
   */
  getFormConfig() {
    _.forEach(this.categoryMasterList, (category) => {
      _.forEach(this.formFieldProperties, (formFieldCategory) => {
        if (category.code === formFieldCategory.code) {
          formFieldCategory.range = category.terms;
        }
        return formFieldCategory;
      });
    });
    this.formFieldProperties = _.sortBy(_.uniqBy(this.formFieldProperties, 'code'), 'index');
    this._cacheService.set(this.contentType + this.formAction, this.formFieldProperties,
      {
        maxAge: this.configService.appConfig.cacheServiceConfig.setTimeInMinutes *
          this.configService.appConfig.cacheServiceConfig.setTimeInSeconds
      });
  }
  /****
* Redirects to workspace create section
*/
  goToCreate() {
    setTimeout(() => {
      this.router.navigate(['myassets']);
    }, 1600);
  }

  /**
* requestBody is returned of type object
*/
  generateData(data) {

    this.showLoader = true;
    const requestData = _.cloneDeep(data);
    console.log('generate data = ', requestData);
    requestData.name = data.name ? data.name : this.name,
      requestData.assetformat = data.assetformat ? data.assetformat : null;
    requestData.licensetype = data.licensetype ? data.licensetype : null;
    requestData.description = data.description ? data.description : this.description,
      requestData.createdBy = this.userProfile.id,
      requestData.organisation = this.userProfile.organisationNames,
      requestData.createdFor = this.userProfile.organisationIds,
      requestData.contentType = this.configService.appConfig.contentCreateTypeForEditors[this.contentType],
      requestData.framework = this.framework;
    requestData.keywords = _.uniqWith(requestData.keywords, _.isEqual);
    requestData['tags'] = requestData.keywords;
    requestData.version = parseFloat(requestData.version);
    delete requestData.status;
    // delete requestData.framework;
    // delete requestData.contentType;

    if (this.contentType === 'studymaterial' && data.link && data.mimeType === 'text/x-url') {
      requestData.mimeType = 'text/x-url';
      requestData['artifactUrl'] = data.link;
      // requestData.mimeType = 'application/pdf'
    } else if (this.enableContent) {
      requestData.mimeType = 'application/vnd.ekstep.ecml-archive';
    } else if (!!data.mimeType && (data.artifactUrl !== '' && data.artifactUrl !== undefined)) {
      requestData.mimeType = data.mimeType;
    } else if (data.mimeType === 'application/pdf') {
      requestData.mimeType = 'application/pdf';
    } else {
      delete requestData.versionKey;
    }
    if (this.resourceType) {
      requestData.resourceType = this.resourceType;
    }
    if (!_.isEmpty(this.userProfile.lastName)) {
      requestData.creator = this.userProfile.firstName + ' ' + this.userProfile.lastName;
      //  requestData.submittedBy = this.userProfile.firstName + ' ' + this.userProfile.lastName;
    } else {
      requestData.creator = this.userProfile.firstName;
      // requestData.submittedBy = this.userProfile.firstName + ' ' + this.userProfile.lastName;
    }
    return requestData;
  }
  checkFields() {

    this.formData.formInputData['assetformat'] = this.formData['assetformat'];
    this.formData.formInputData['licensetype'] = this.formData['licensetype'];
    this.formData.formInputData['artifactUrl'] = this.content.artifactUrl;
    this.formData.formInputData['link'] = this.content.artifactUrl;
    const data = _.pickBy(this.formData.formInputData);
    console.log('data in update form = ', data);
    // if (!!data.name && !!data.assetformat && !!data.licensetype && !!data.board && !!data.description
    //   && (!!data.keywords && data.keywords.length > 0) && !!data.creators &&
    //   !!data.version && !!data.region && !!data.year && (!!data.languages && data.languages.length > 0)) {

    // this.uploadSuccess = true;
    // this.updateContent();
    // }
    if (!!data.name && !!data.description && (!!data.keywords && data.keywords.length > 0 && this.enableLink)
    ) {


      this.uploadSuccess = true;
      this.updateContent();
    } else if (!!data.name && !!data.description && (!!data.keywords && data.keywords.length > 0 &&
      !!data.assetformat && !!data.licensetype && !!data.board && !!data.creators && !!data.version
      && (!!data.languages && data.languages.length > 0) &&
      !this.enableLink)) {

      this.uploadSuccess = true;
      this.updateContent();

    } else {
      this.showMessage = true;
      this.toasterService.error('Asset updation failed please provide required fields');
    }
  }
  checkFieldofFile() {

    this.formData.formInputData['assetformat'] = this.formData['assetformat'];
    this.formData.formInputData['licensetype'] = this.formData['licensetype'];
    this.formData.formInputData['artifactUrl'] = this.content.artifactUrl;
    this.formData.formInputData['link'] = this.content.artifactUrl;
    const data = _.pickBy(this.formData.formInputData);
    if (!!data.name && !!data.assetformat && !!data.licensetype && !!data.board && !!data.description &&
      (!!data.keywords && data.keywords.length > 0) && !!data.creators &&
      !!data.version && !!data.region && !!data.year && (!!data.languages && data.languages.length > 0)) {
      this.uploadSuccess = true;
      this.updatebtnStatus = true;
      // if (this.fileList) {
      //   if (this.fileList.size < 50000000) {
      //     this.updateContentFile();

      //   } else {
      //     this.toasterService.error('File size should be less than 50MB');
      //   }
      // } else {
      this.updateContent();

      // }

    } else {
      this.toasterService.error('Asset creation failed please provide required fields');
    }
  }

  updateContentFile() {

    const requestData = {
      content: this.generateData(_.pickBy(this.formData.formInputData)),
    };

    if (this.contentType === 'studymaterial' && this.uploadSuccess === true) {
      this.editorService.update(requestData, this.activatedRoute.snapshot.params.contentId).subscribe(res => {

        this.contentId = res.result.content_id;
        this.uploadFileEvent();

        this.toasterService.success('Asset updated Successfully');
      }, err => {
        this.toasterService.error('Asset updation failed please try after some time');

      });
    } else {
      this.toasterService.error('Asset updation failed please try after some time');
    }
  }
  updateContent() {
    const requestData = {
      content: this.generateData(_.pickBy(this.formData.formInputData)),
    };
    if (this.contentType === 'studymaterial' && this.uploadSuccess === true) {
      this.editorService.update(requestData, this.activatedRoute.snapshot.params.contentId).subscribe(res => {

        this.toasterService.success('Asset updated Successfully');
        this.goToCreate();
      }, err => {
        this.toasterService.error('Asset updation failed please try after some time');
        this.updatebtnStatus = false;
      });
    } else {
      this.toasterService.error('Asset updation failed please try after ');
      this.updatebtnStatus = false;
    }
  }

  basicUploadFile(event) {
    this.fileList = event.target.files[0];
  }

  uploadFileEvent() {

    const data = {
      fileName: this.fileList.name
    };
    const request = {
      content: data
    };

    this.editorService.uploadUrl(request, this.contentId).subscribe(res => {
      this.toasterService.success('uploaded successfully');
      const pdfurl = res.result.pre_signed_url.substring(0, res.result.pre_signed_url.lastIndexOf('?'));
      this.workSpaceService.uploadPreSigned(res.result.pre_signed_url, this.fileList).subscribe(ress => {
        this.editorService.upload(pdfurl, this.contentId).subscribe(response => {


        });
        this.goToCreate();

      }, err => {
        this.toasterService.error('asset creation failed');
      }

      );

      // this.editorService.upload()
    }, err => {
      this.toasterService.error('asset creation failed');
    });

  }

  createLockAndNavigateToEditor(content) {
    const state = 'draft';
    const framework = this.framework;
  }

  /**
    * Issue #SB-1448,  If previous url is not from create page, redirect current page to 'workspace/content/create'
  */
  checkForPreviousRouteForRedirect() {
    const previousUrlObj = this.navigationHelperService.getPreviousUrl();

    if (previousUrlObj && previousUrlObj.url && (previousUrlObj.url !== '/myassets')) {
      this.redirect();
    }
  }
  redirect() {
    this.router.navigate(['/myassets/update', this.contentID]);

  }
  contentClick() {
    if (_.size(this.content.lockInfo)) {
      this.lockPopupData = this.content;
      this.showLockedContentModal = true;
    } else {
      const status = this.content.status.toLowerCase();
      if (status === 'processing') {
        return;
      }
      if (status === 'draft') { // only draft state contents need to be locked
        // this.workSpaceService.navigateToContent(this.content, this.state);
        this.router.navigate(['myassets/update/edit/generic', this.content.identifier, this.state, status]);
      } else {
        // this.workSpaceService.navigateToContent(this.content, this.state);
        this.router.navigate(['myassets/update/edit/generic', this.content.identifier, this.state, status]);
      }
    }
  }
}