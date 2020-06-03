import { combineLatest, Subject } from 'rxjs';
import { PageApiService, OrgDetailsService, UserService, SearchService, FrameworkService } from '@sunbird/core';
import { PublicPlayerService } from './../../../../services';
import { Component, OnInit, OnDestroy, EventEmitter, HostListener, AfterViewInit } from '@angular/core';
import {
  ResourceService, ToasterService, INoResultMessage, ConfigService, UtilService, ICaraouselData,
  BrowserCacheTtlService, NavigationHelperService
} from '@sunbird/shared';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash-es';
import { IInteractEventEdata, IImpressionEventInput } from '@sunbird/telemetry';
import { takeUntil, map, mergeMap, first, filter, tap } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import { environment } from '@sunbird/environment';
import { IPagination } from '@sunbird/announcement';
import { ICard } from '@sunbird/shared';
import { PaginationService } from '@sunbird/shared';
// import { open } from 'fs';


@Component({
  selector: 'app-explore-component',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent implements OnInit, OnDestroy, AfterViewInit {

  public showLoader = true;
  public showLoginModal = false;
  public baseUrl: string;
  public noResultMessage: INoResultMessage;
  public carouselMasterData: Array<ICaraouselData> = [];
  public filterType: string;
  public queryParams: any;
  public hashTagId: string;
  public unsubscribe$ = new Subject<void>();
  public telemetryImpression: IImpressionEventInput;
  public inViewLogs = [];
  public sortIntractEdata: IInteractEventEdata;
  public dataDrivenFilters: any = {};
  public dataDrivenFilterEvent = new EventEmitter();
  public initFilters = false;
  public loaderMessage;
  public pageSections: Array<ICaraouselData> = [];
  public slug;
  isOffline: boolean = environment.isOffline;
  public paramType = [
    'assetType',
    'focusArea',
    'organization',
    'region',
    'gradeLevel',
    'topic',
    'board',
    'channel',
    'languages',
    'country'
  ];
  public sortByOption = [
    {
        'field': 'lastUpdatedOn',
        'name': 'Modified On'
    },
    {
        'field': 'createdOn',
        'name': 'Created On'
    }];
  showExportLoader = false;
  contentName: string;
  organisationId: string;
  public facetsList: any;
  public paginationDetails: IPagination;
  public contentList: Array<ICard> = [];
  showDownloadLoader = false;
  sectionObj: { slug: any, sectionUrl: string, pageNumber: number, queryParams: any};

  sectionData = false;
  @HostListener('window:scroll', []) onScroll(): void {
    if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight * 2 / 3)
      && this.pageSections.length < this.carouselMasterData.length) {
      this.pageSections.push(this.carouselMasterData[this.pageSections.length]);
    }
  }
  constructor(private pageApiService: PageApiService, private toasterService: ToasterService, public searchService: SearchService,
    public paginationService: PaginationService, public resourceService: ResourceService,
    private configService: ConfigService, private activatedRoute: ActivatedRoute,
    public router: Router, private utilService: UtilService, private orgDetailsService: OrgDetailsService,
    private publicPlayerService: PublicPlayerService, private cacheService: CacheService,
    private browserCacheTtlService: BrowserCacheTtlService, private userService: UserService,
    public navigationhelperService: NavigationHelperService, public frameworkService: FrameworkService ) {
    this.router.onSameUrlNavigation = 'reload';
    this.filterType = this.configService.appConfig.explore.filterType;
    this.paginationDetails = this.paginationService.getPager(0, 1, this.configService.appConfig.SEARCH.PAGE_LIMIT);

  }

  ngOnInit() {
    this.orgDetailsService.getOrgDetails(this.activatedRoute.snapshot.params.slug).pipe(
      mergeMap((orgDetails: any) => {
        this.slug = orgDetails.slug;
        this.hashTagId = orgDetails.hashTagId;
        this.initFilters = true;
        this.organisationId = orgDetails.id;
        return this.dataDrivenFilterEvent;
      }), first()
    ).subscribe((filters: any) => {
      this.dataDrivenFilters = filters;
      this.fetchContentOnParamChange();
      this.setNoResultMessage();
    },
      error => {
        this.router.navigate(['']);
      }
    );

    
  }

  public getFilters(filters) {
    const defaultFilters = _.reduce(filters, (collector: any, element) => {
      if (element.code === 'board') {
        collector.board = _.get(_.orderBy(element.range, ['index'], ['asc']), '[0].name') || '';
      }
      return collector;
    }, {});
    this.dataDrivenFilterEvent.emit(defaultFilters);
  }
  private fetchContentOnParamChange() {
    combineLatest(this.activatedRoute.params, this.activatedRoute.queryParams).pipe(
      takeUntil(this.unsubscribe$))
      .subscribe((result) => {
        this.showLoader = true;
        this.queryParams = { ...result[1] };
        this.carouselMasterData = [];
        this.pageSections = [];
        this.fetchPageData();
      });
  }
  private fetchPageData() {
    let option;
   
   if (this.slug === 'sunbirdorg') {
 //  console.log('in explore page');
 let filters = _.pickBy(this.queryParams, (value: Array<string> | string) => value && value.length);
            filters = _.omit(filters, ['key', 'sort_by', 'sortType', 'appliedFilters']);
            const softConstraintData: any = {
                filters: {
                    channel: this.hashTagId,
                },
                softConstraints: _.get(this.activatedRoute.snapshot, 'data.softConstraints'),
                mode: 'soft'
            };
            const manipulatedData = this.utilService.manipulateSoftConstraint(_.get(this.queryParams,
                'appliedFilters'), softConstraintData);
            // filters =  _.get(this.queryParams, 'appliedFilters') ? filters :  manipulatedData.filters;
        option = {
                filters: _.get(this.queryParams, 'appliedFilters') ? filters : manipulatedData.filters,
                limit: this.configService.appConfig.SEARCH.PAGE_LIMIT,
                offset: 0,
                query: this.queryParams.key,
                params: this.configService.appConfig.ExplorePage.contentApiQueryParams
            };
            console.log('explore content component query param = ', this.queryParams);
            option.filters.objectType = 'Asset';
            option.filters.contentType = [];
            option.filters.channel = [];
            if (this.queryParams.hasOwnProperty('sort_by')) {
                const sortby = this.queryParams.sort_by;
                const sorttype = this.queryParams.sortType;
                if (sortby === 'lastUpdatedOn') {
                   option.sort_by = { 'lastUpdatedOn' : sorttype};
                }
                if (sortby === 'createdOn') {
                    option.sort_by = { 'createdOn' : sorttype};
                 }
            }
            this.frameworkService.channelData$.subscribe((channelData) => {
                if (!channelData.err) {
                    option.params.framework = 'NCERT';
                }
            });
            console.log('option', option, filters);
            this.searchService.compositeSearch(option).subscribe(data => {
                this.showLoader = false;
                console.log('card data from explore content = ', data);
                    this.facetsList = this.searchService.processFilterData(_.get(data, 'result.facets'));
                    this.paginationDetails = this.paginationService.getPager(data.result.count, this.paginationDetails.currentPage,
                        this.configService.appConfig.SEARCH.PAGE_LIMIT);
                    const { constantData, metaData, dynamicFields } = this.configService.appConfig.LibrarySearch;
                    this.contentList = this.utilService.getDataForCard(data.result.Asset, constantData, dynamicFields, metaData);

                    const asset = [];
                    _.map(this.contentList, object => {
                      // console.log('obj = ', object);
                      if (object.creators !== 'SPace') {
                     asset.push(object);
                      }
                    });
                    this.contentList = asset;
                    console.log('this.contentList = ', this.contentList, asset);
                }, err => {
                    this.showLoader = false;
                    this.contentList = [];
                    this.facetsList = [];
                    this.paginationDetails = this.paginationService.getPager(0, this.paginationDetails.currentPage,
                        this.configService.appConfig.SEARCH.PAGE_LIMIT);
                    this.toasterService.error(this.resourceService.messages.fmsg.m0051);
                });
   } else if (this.slug === 'space') {
    const filters = _.pickBy(this.queryParams, (value: Array<string> | string, key) => {
      if (_.includes(['sort_by', 'sortType', 'appliedFilters'], key)) {
        return false;
      }
      return value.length;
    });
    const softConstraintData = {
      filters: {
        board: [],
      //  channel: this.userService.hashTagId
      },
      mode: 'soft'
    };
    const manipulatedData = this.utilService.manipulateSoftConstraint(_.get(this.queryParams, 'appliedFilters'),
      softConstraintData);
     option = {
      source: 'web',
      name: 'Explore',
      // filters: _.get(this.queryParams, 'appliedFilters') ? filters : _.get(manipulatedData, 'filters'),
      filters: {
        organisation: this.configService.appConfig.ExplorePage.orgName,
        region: [],
         contentType: ['Resource'],
        status: ['Live'],
        board: [],
        channel: [],
        gradeLevel: [],
        topic: [],
        languages: [],
        country: [],
        creators: [],
       // sector: [],
       // assetType: [],
      },
      mode: _.get(manipulatedData, 'mode'),
      exists: [],
      // params: this.configService.appConfig.ExplorePage.contentApiQueryParams
    };
    if (_.get(manipulatedData, 'filters')) {
      option['softConstraints'] = _.get(manipulatedData, 'softConstraints');
    }
    /*
    adding channel code in the filters to show relevant courses only
    change made by RISHABH KALRA, NIIT LTD on 12-06-2019
    */
   console.log('q params in explore page = ', this.queryParams);
  option.filters.organisation = this.configService.appConfig.ExplorePage.orgName;
  this.paramType.forEach(param => {
    if (this.queryParams.hasOwnProperty(param)) {
      if (param === 'board') {
        option.filters.board = this.queryParams[param];
      }
      if (param === 'organization') {
        option.filters.organisation = this.queryParams[param];
      }
      if (param === 'channel') {
        option.filters.creators = this.queryParams[param];
      }
      if (param === 'country') {
        option.filters.region = this.queryParams[param];
      }
      if (param === 'gradeLevel') {
        option.filters.gradeLevel = this.queryParams[param];
      }
      if (param === 'topic') {
        option.filters.topic = this.queryParams[param];
      }
      if (param === 'languages') {
        option.filters.languages = this.queryParams[param];
      }
      // if (param === 'country') {
      //   option.filters.country = this.queryParams[param];
      // }
     // this.contentCompositeSearch(option);
       this.callingPageApi(option);
    }
  });
//  this.contentCompositeSearch(option);
 this.callingPageApi(option);
   } else if (this.slug !== 'sunbirdorg' && this.slug !== 'space') {
    //  console.log('in explore page');
    const filters = _.pickBy(this.queryParams, (value: Array<string> | string, key) => {
      if (_.includes(['sort_by', 'sortType', 'appliedFilters'], key)) {
        return false;
      }
      return value.length;
    });
    const softConstraintData = {
      filters: {
        channel: this.hashTagId,
        board: [this.dataDrivenFilters.board]
      },
      // softConstraints: _.get(this.activatedRoute.snapshot, 'data.softConstraints'),
      mode: 'soft'
    };
    const manipulatedData = this.utilService.manipulateSoftConstraint(_.get(this.queryParams, 'appliedFilters'),
      softConstraintData);
     option = {
      organisationId: this.organisationId,
      source: 'web',
      name: 'Explore',
      filters: _.get(this.queryParams, 'appliedFilters') ? filters : _.get(manipulatedData, 'filters'),
      mode: _.get(manipulatedData, 'mode'),
      exists: [],
      params: this.configService.appConfig.ExplorePage.contentApiQueryParams
    };
    if (_.get(manipulatedData, 'filters')) {
      option['softConstraints'] = _.get(manipulatedData, 'softConstraints');
    }
    /*
    adding channel code in the filters to show relevant courses only
    change made by RISHABH KALRA, NIIT LTD on 12-06-2019
    */
   option.filters['channel'] = [this.hashTagId];

    this.pageApiService.getPageData(option)
      .subscribe(data => {
        this.showLoader = false;
        this.carouselMasterData = this.prepareCarouselData(_.get(data, 'sections'));
        if (!this.carouselMasterData.length) {
          return; // no page section
        }
        if (this.carouselMasterData.length >= 2) {
          this.pageSections = [this.carouselMasterData[0], this.carouselMasterData[1]];
        } else if (this.carouselMasterData.length >= 1) {
          this.pageSections = [this.carouselMasterData[0]];
        }
      }, err => {
        this.showLoader = false;
        this.carouselMasterData = [];
        this.pageSections = [];
        this.toasterService.error(this.resourceService.messages.fmsg.m0004);
      });
   }
  }
  contentCompositeSearch(option) {
    this.searchService.compositeSearch(option).subscribe(data => {
      this.showLoader = false;
          // this.facetsList = this.searchService.processFilterData(_.get(data, 'result.facets'));
          // this.paginationDetails = this.paginationService.getPager(data.result.count, this.paginationDetails.currentPage,
          //     this.configService.appConfig.SEARCH.PAGE_LIMIT);
          const { constantData, metaData, dynamicFields } = this.configService.appConfig.LibrarySearch;
          // this.contentList = this.utilService.getDataForCard(data.result.Asset, constantData, dynamicFields, metaData);

          this.showLoader = false;
          this.carouselMasterData = this.utilService.getDataForCard(data.result.Asset, constantData, dynamicFields, metaData);
          // this.carouselData = this.utilService.getDataForCard(data.result.Asset, constantData, dynamicFields, metaData);
          console.log('card data from resource content = ', data);
          if (!this.carouselMasterData.length) {
            return; // no page section
          }
          if (this.carouselMasterData.length >= 2) {
            this.pageSections = [this.carouselMasterData[0], this.carouselMasterData[1]];
          } else if (this.carouselMasterData.length >= 1) {
            this.pageSections = [this.carouselMasterData[0]];
          }


      //  this.carouselMasterData = asset;
      //  this.carouselData = asset;
          console.log('this.contentList = ', this.carouselMasterData, this.pageSections);
      }, err => {
        this.showLoader = false;
        this.carouselMasterData = [];
        // this.carouselData = [];
        this.pageSections = [];
        this.toasterService.error(this.resourceService.messages.fmsg.m0004);
      });
  }
  callingPageApi(option) {
    this.pageApiService.getPageData(option)
    .subscribe(data => {
      this.showLoader = false;
      this.carouselMasterData = this.prepareCarouselData(_.get(data, 'sections'));
      if (!this.carouselMasterData.length) {
        return; // no page section
      }
      if (this.carouselMasterData.length >= 2) {
        this.pageSections = [this.carouselMasterData[0], this.carouselMasterData[1]];
        if(this.slug === 'space') {
          this.viewAll(this.pageSections[0]);
        }
      } else if (this.carouselMasterData.length >= 1) {
        this.pageSections = [this.carouselMasterData[0]];
        if(this.slug === 'space') {
          this.viewAll(this.pageSections)
        }
      }
    }, err => {
      this.showLoader = false;
      this.carouselMasterData = [];
      this.pageSections = [];
      this.toasterService.error(this.resourceService.messages.fmsg.m0004);
    });
  }
  private prepareCarouselData(sections = []) {
    const { constantData, metaData, dynamicFields, slickSize } = this.configService.appConfig.ExplorePage;
    const carouselData = _.reduce(sections, (collector, element) => {
      const contents = _.slice(_.get(element, 'contents'), 0, slickSize) || [];
      element.contents = this.utilService.getDataForCard(contents, constantData, dynamicFields, metaData);
      if (element.contents && element.contents.length) {
        collector.push(element);
      }
      return collector;
    }, []);
    return carouselData;
  }
  public prepareVisits(event) {
    _.forEach(event, (inView, index) => {
      if (inView.metaData.identifier) {
        this.inViewLogs.push({
          objid: inView.metaData.identifier,
          objtype: inView.metaData.contentType,
          index: index,
          section: inView.section,
        });
      }
    });
    this.telemetryImpression.edata.visits = this.inViewLogs;
    this.telemetryImpression.edata.subtype = 'pageexit';
    this.telemetryImpression = Object.assign({}, this.telemetryImpression);
  }
  public playContent(event) {

    // For offline environment content will only play when event.action is open
    if (event.action === 'download' && this.isOffline) {
    //  this.startDownload(event.data.metaData.identifier);
      this.showDownloadLoader = true;
      this.contentName = event.data.name;
      return false;
    } else if (event.action === 'export' && this.isOffline) {
      this.showExportLoader = true;
      this.contentName = event.data.name;
    //  this.exportOfflineContent(event.data.metaData.identifier);
      return false;
    }

    if (!this.userService.loggedIn && event.data.contentType === 'Course') {
      this.showLoginModal = true;
      this.baseUrl = '/' + 'learn' + '/' + 'course' + '/' + event.data.metaData.identifier;
    } else {
      if (_.includes(this.router.url, 'browse') && this.isOffline) {
        this.publicPlayerService.playContentForOfflineBrowse(event);
      } else {
        this.publicPlayerService.playContent(event);
      }
    }
  }
  public viewAll(event) {
    if (event) {

      const searchQuery = JSON.parse(event.searchQuery);
      const softConstraintsFilter = {
        board: [this.dataDrivenFilters.board],
        channel: this.hashTagId,
      };
      if (_.includes(this.router.url, 'browse') || !this.isOffline) {
        searchQuery.request.filters.defaultSortBy = JSON.stringify(searchQuery.request.sort_by);
        searchQuery.request.filters.softConstraintsFilter = JSON.stringify(softConstraintsFilter);
        searchQuery.request.filters.exists = searchQuery.request.exists;
      }
      this.cacheService.set('viewAllQuery', searchQuery.request.filters);
      this.cacheService.set('pageSection', event, { maxAge: this.browserCacheTtlService.browserCacheTtl });
      const queryParams = { ...searchQuery.request.filters, ...this.queryParams };
      const sectionUrl = this.router.url.split('?')[0] + '/view-all/' + event.name.replace(/\s/g, '-');
      this.sectionObj = {
        slug: this.slug,
        sectionUrl : sectionUrl,
        pageNumber : 1,
        queryParams : queryParams
      };
      this.sectionData = true;
    }
   // this.router.navigate([sectionUrl, 1], { queryParams: queryParams });
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.setTelemetryData();
    });
  }
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  private setTelemetryData() {
    this.telemetryImpression = {
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
        uri: this.router.url,
        subtype: this.activatedRoute.snapshot.data.telemetry.subtype,
        duration: this.navigationhelperService.getPageLoadTime()
      }
    };
    this.sortIntractEdata = {
      id: 'sort',
      type: 'click',
      pageid: this.activatedRoute.snapshot.data.telemetry.pageid
    };
  }
  private setNoResultMessage() {
    if (this.isOffline && !(this.router.url.includes('/browse'))) {
      this.noResultMessage = {
        'message': 'messages.stmsg.m0007',
        'messageText': 'messages.stmsg.m0133'
      };
    } else {
      this.noResultMessage = {
        'message': 'messages.stmsg.m0007',
        'messageText': 'messages.stmsg.m0006'
      };
    }
  }

  

  // updateCardData(downloadListdata) {
  //   _.each(this.pageSections, (pageSection) => {
  //     _.each(pageSection.contents, (pageData) => {
  //       this.publicPlayerService.updateDownloadStatus(downloadListdata, pageData);
  //     });
  //   });
  // }

}