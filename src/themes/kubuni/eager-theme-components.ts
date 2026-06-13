import { JournalComponent } from './app/entity-groups/journal-entities/item-pages/journal/journal.component';
import { JournalIssueComponent } from './app/entity-groups/journal-entities/item-pages/journal-issue/journal-issue.component';
import { JournalVolumeComponent } from './app/entity-groups/journal-entities/item-pages/journal-volume/journal-volume.component';
import { PersonComponent } from './app/entity-groups/research-entities/item-pages/person/person.component';
import { FooterComponent } from './app/footer/footer.component';
import { HeaderComponent } from './app/header/header.component';
import { HeaderNavbarWrapperComponent } from './app/header-nav-wrapper/header-navbar-wrapper.component';
import { HomeNewsComponent } from './app/home-page/home-news/home-news.component';
import { TopLevelCommunityListComponent } from './app/home-page/top-level-community-list/top-level-community-list.component';
import { PublicationComponent } from './app/item-page/simple/item-types/publication/publication.component';
import { ThesisComponent } from './app/item-page/simple/item-types/thesis/thesis.component';
import { UntypedItemComponent } from './app/item-page/simple/item-types/untyped-item/untyped-item.component';
import { NavbarComponent } from './app/navbar/navbar.component';
import { SearchNavbarComponent } from './app/search-navbar/search-navbar.component';
import { CollectionDropdownComponent } from './app/shared/collection-dropdown/collection-dropdown.component';
import { CreateCollectionParentSelectorComponent } from './app/shared/dso-selector/modal-wrappers/create-collection-parent-selector/create-collection-parent-selector.component';
import { CreateCommunityParentSelectorComponent } from './app/shared/dso-selector/modal-wrappers/create-community-parent-selector/create-community-parent-selector.component';
import { CreateItemParentSelectorComponent } from './app/shared/dso-selector/modal-wrappers/create-item-parent-selector/create-item-parent-selector.component';
import { EditCollectionSelectorComponent } from './app/shared/dso-selector/modal-wrappers/edit-collection-selector/edit-collection-selector.component';
import { EditCommunitySelectorComponent } from './app/shared/dso-selector/modal-wrappers/edit-community-selector/edit-community-selector.component';
import { EditItemSelectorComponent } from './app/shared/dso-selector/modal-wrappers/edit-item-selector/edit-item-selector.component';
import { FileDownloadLinkComponent } from './app/shared/file-download-link/file-download-link.component';
import { LangSwitchComponent } from './app/shared/lang-switch/lang-switch.component';
import { LogInComponent } from './app/shared/log-in/log-in.component';
import { BrowseEntryListElementComponent } from './app/shared/object-list/browse-entry-list-element/browse-entry-list-element.component';
import { CollectionListElementComponent } from './app/shared/object-list/collection-list-element/collection-list-element.component';
import { CommunityListElementComponent } from './app/shared/object-list/community-list-element/community-list-element.component';
import { ItemSearchResultListElementComponent } from './app/shared/object-list/search-result-list-element/item-search-result/item-types/item/item-search-result-list-element.component';
import { PublicationSidebarSearchListElementComponent } from './app/shared/object-list/sidebar-search-list-element/item-types/publication/publication-sidebar-search-list-element.component';
import { StartsWithDateComponent } from './app/shared/starts-with/date/starts-with-date.component';
import { StartsWithTextComponent } from './app/shared/starts-with/text/starts-with-text.component';

export const COMPONENTS = [
  JournalComponent,
  JournalIssueComponent,
  JournalVolumeComponent,
  PersonComponent,
  PublicationComponent,
  ThesisComponent,
  UntypedItemComponent,
  CommunityListElementComponent,
  CollectionListElementComponent,
  CollectionDropdownComponent,
  FileDownloadLinkComponent,
  StartsWithDateComponent,
  StartsWithTextComponent,
  PublicationSidebarSearchListElementComponent,
  ItemSearchResultListElementComponent,
  TopLevelCommunityListComponent,
  BrowseEntryListElementComponent,
  HomeNewsComponent,
  HeaderComponent,
  HeaderNavbarWrapperComponent,
  NavbarComponent,
  SearchNavbarComponent,
  FooterComponent,
  CreateCollectionParentSelectorComponent,
  CreateCommunityParentSelectorComponent,
  CreateItemParentSelectorComponent,
  EditCollectionSelectorComponent,
  EditCommunitySelectorComponent,
  EditItemSelectorComponent,
  LogInComponent,
  LangSwitchComponent,
];
