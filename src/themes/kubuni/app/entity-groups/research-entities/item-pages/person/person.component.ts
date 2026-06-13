import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ThemedItemPageTitleFieldComponent } from 'src/app/item-page/simple/field-components/specific-field/title/themed-item-page-field.component';
import { TabbedRelatedEntitiesSearchComponent } from 'src/app/item-page/simple/related-entities/tabbed-related-entities-search/tabbed-related-entities-search.component';
import { RelatedItemsComponent } from 'src/app/item-page/simple/related-items/related-items-component';
import { DsoEditMenuComponent } from 'src/app/shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { MetadataFieldWrapperComponent } from 'src/app/shared/metadata-field-wrapper/metadata-field-wrapper.component';
import { ThemedResultsBackButtonComponent } from 'src/app/shared/results-back-button/themed-results-back-button.component';
import { ThemedThumbnailComponent } from 'src/app/thumbnail/themed-thumbnail.component';

import { Context } from '../../../../../../../app/core/shared/context.model';
import { ViewMode } from '../../../../../../../app/core/shared/view-mode.model';
import { PersonComponent as BaseComponent } from '../../../../../../../app/entity-groups/research-entities/item-pages/person/person.component';
import { listableObjectComponent } from '../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { TruncatableComponent } from 'src/app/shared/truncatable/truncatable.component';
import { TruncatablePartComponent } from 'src/app/shared/truncatable/truncatable-part/truncatable-part.component';
import { CapitalizePipe } from 'src/app/shared/utils/capitalize.pipe';
import { StripLineBreaksPipe } from 'src/themes/kubuni/app/otcloud-apps/strip-line-breaks.pipe';

@listableObjectComponent('Person', ViewMode.StandalonePage, Context.Any, 'kubuni')
@Component({
  selector: 'ds-person',
  styleUrls: ['../../../../../../../app/entity-groups/research-entities/item-pages/person/person.component.scss'],
  templateUrl: './person.component.html',
  imports: [
    AsyncPipe,
    DsoEditMenuComponent,
    MetadataFieldWrapperComponent,
    RelatedItemsComponent,
    RouterLink,
    TabbedRelatedEntitiesSearchComponent,
    ThemedItemPageTitleFieldComponent,
    ThemedResultsBackButtonComponent,
    ThemedThumbnailComponent,
    TranslateModule, TruncatableComponent,
    TruncatablePartComponent, CapitalizePipe, StripLineBreaksPipe
  ],
})
export class PersonComponent extends BaseComponent implements OnInit {
  shareLinks: { facebook: string; twitter: string; linkedin: string; email: string } = {
    facebook: '',
    twitter: '',
    linkedin: '',
    email: '',
  };
  identifierURLs: string[];
  handleIdentifier: string;
  shortBio: string;
  givenName: string;
  familyName: string;
  fullName: string;

  ngOnInit(): void {
    super.ngOnInit();
    this.familyName = this.object.firstMetadataValue(['person.familyName']);
    this.givenName = this.object.firstMetadataValue(['person.givenName']);
    this.fullName = `${this.familyName}, ${this.givenName}`;
    this.shortBio = this.object.firstMetadataValue(['person.shortBio']);
    this.identifierURLs = this.object.allMetadataValues(['dc.identifier.uri']);
    this.handleIdentifier = this.identifierURLs[this.identifierURLs.length - 1];
    this.shareLinks = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${this.handleIdentifier}`,
      twitter: `https://twitter.com/intent/tweet?text=${this.fullName}&url=${this.handleIdentifier}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${this.handleIdentifier}&title=${this.fullName}&summary=${this.shortBio}`,
      email: `mailto:?subject=${encodeURIComponent(`Check out this Researcher Profile: ${this.fullName}`)}&body=${encodeURIComponent(
        `Interesting Profile: ${this.fullName}\n\nRead it here: ${this.handleIdentifier}`,
      )}`,
    };
  }

  /**
   * Converts an ISO language code to its full English display name.
   * @param isoCode standard ISO language code
   * @returns full language name in English
   */
  getLanguageName(isoCode: string): string {
    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
      return displayNames.of(isoCode) || isoCode;
    } catch (e) {
      return isoCode;
    }
  }
}
