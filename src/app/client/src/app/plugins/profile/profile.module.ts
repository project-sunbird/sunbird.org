import { SharedFeatureModule } from '@sunbird/shared-feature';
import { ProfileService } from './services';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@sunbird/shared';
import { SlickModule } from 'ngx-slick';
import { ProfileRoutingModule } from './profile-routing.module';
import {
  ProfilePageComponent,
  ProfileBadgeComponent,
  UpdateContactDetailsComponent,
  UpdateUserDetailsComponent
} from './components';
import {
  SuiSelectModule,
  SuiModalModule,
  SuiAccordionModule,
  SuiPopupModule,
  SuiDropdownModule,
  SuiProgressModule,
  SuiRatingModule,
  SuiCollapseModule
} from 'ng2-semantic-ui';
import { CoreModule } from '@sunbird/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { WebExtensionModule } from '@project-sunbird/web-extensions';
import { TelemetryModule } from '@sunbird/telemetry';
import { WebExtensionModule } from '@project-sunbird/web-extensions';
import { AvatarModule } from 'ngx-avatar';
import { OrgManagementModule } from '../../modules/org-management/org-management.module';
import { NgInviewModule } from 'angular-inport';
import { EditemailComponent } from './components/editemail/editemail.component';
@NgModule({
  imports: [
    CommonModule,
    ProfileRoutingModule,
    SharedModule,
    SuiSelectModule,
    SuiModalModule,
    SuiAccordionModule,
    SuiPopupModule,
    SuiDropdownModule,
    SuiProgressModule,
    SuiRatingModule,
    SuiCollapseModule,
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
    WebExtensionModule,
    TelemetryModule,
    SlickModule,
    NgInviewModule,
    OrgManagementModule,
    AvatarModule,
    SharedFeatureModule
  ],
  declarations: [
    ProfilePageComponent,
    ProfileBadgeComponent,
    UpdateContactDetailsComponent,
    UpdateUserDetailsComponent,
    EditemailComponent
  ],
  providers: []
})
export class ProfileModule {}
