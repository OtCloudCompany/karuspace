import { FacetValue } from "@dspace/core/shared/search/models/facet-value.model";
export class KubuniFacetValue extends FacetValue {
    /**
     * The display label of the facet value
     */

    get followLink(): string {
        return `/search?f.entityType=${this.label},equals&spc.page=1`; 
    }

	
}