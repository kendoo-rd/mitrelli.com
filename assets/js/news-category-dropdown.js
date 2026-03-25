(function () {
	'use strict';

	var catData = window.newsCategoryData || {};

	/*
	 * Phase 1 – inject a hidden .e-filter-item for every child category into
	 * .e-filter *before* DOMContentLoaded so Elementor includes them in
	 * its $filterButtons cache.
	 */
	(function injectHiddenButtons() {
		var filterEl = document.querySelector( '.elementor-widget-taxonomy-filter .e-filter' );
		if ( ! filterEl ) return;

		Object.keys( catData ).forEach( function ( slug ) {
			if ( ! catData[ slug ].parent_slug ) return;
			if ( filterEl.querySelector( '.e-filter-item--hidden-child[data-filter="' + slug + '"]' ) ) return;

			var btn = document.createElement( 'button' );
			btn.className = 'e-filter-item e-filter-item--hidden-child';
			btn.setAttribute( 'data-filter',  slug );
			btn.setAttribute( 'aria-pressed', 'false' );
			btn.textContent = catData[ slug ].name;
			filterEl.appendChild( btn );
		} );
	}() );

	/*
	 * Phase 2 – build the visible hover-dropdown UI once the DOM is ready.
	 */
	function buildDropdowns() {
		var filterEl = document.querySelector( '.elementor-widget-taxonomy-filter .e-filter' );
		if ( ! filterEl ) return;

		// parentSlug -> [{ slug, name }]
		var childrenMap = {};
		Object.keys( catData ).forEach( function ( slug ) {
			var p = catData[ slug ].parent_slug;
			if ( p ) {
				if ( ! childrenMap[ p ] ) childrenMap[ p ] = [];
				childrenMap[ p ].push( { slug: slug, name: catData[ slug ].name } );
			}
		} );

		var filterWidgetEl    = filterEl.closest( '.elementor-widget-taxonomy-filter' );
		var loopWidgetEl      = document.querySelector( '.elementor-widget-loop-grid' );
		var filterId          = filterWidgetEl ? filterWidgetEl.getAttribute( 'data-id' ) : null;
		var selectedElementId = loopWidgetEl   ? loopWidgetEl.getAttribute( 'data-id' )  : null;

		var urlParams       = new URLSearchParams( window.location.search );
		var filterParamName = selectedElementId ? ( 'e-filter-' + selectedElementId + '-category' ) : null;
		var activeChildSlug = filterParamName ? urlParams.get( filterParamName ) : null;

		/*
		 * resetFilterStore – clears the Elementor loop-filter store entry for
		 * this widget before a new filter is applied.
		 *
		 * WHY: if the Elementor taxonomy-filter widget has "multiple selection"
		 * enabled (OR/AND logic), every setFilter() call ACCUMULATES terms on
		 * top of whatever is already stored.  Resetting the store first makes
		 * every click behave as a plain replace (single active filter at a time).
		 */
		function resetFilterStore() {
			var mod = window.elementorProFrontend &&
			          elementorProFrontend.modules &&
			          elementorProFrontend.modules.taxonomyFilter;
			if ( mod && mod.loopWidgetsStore &&
			     typeof mod.loopWidgetsStore.unsetFilter === 'function' &&
			     selectedElementId && filterId ) {
				mod.loopWidgetsStore.unsetFilter( selectedElementId, filterId );
			}
		}

		// Reset all visual filter states: dropdown children, parent indicators,
		// and top-level buttons (needed when Elementor runs in multiple-selection
		// mode, where activateFilterButton() skips its "reset all" step and
		// leaves the previously active top-level button still marked).
		function clearAllSelections() {
			filterEl.querySelectorAll( '.e-filter-item[data-filter]:not(.e-filter-item--hidden-child)' ).forEach( function ( b ) {
				b.setAttribute( 'aria-pressed', 'false' );
			} );
			filterEl.querySelectorAll( '.e-filter-dropdown-child' ).forEach( function ( b ) {
				b.setAttribute( 'aria-pressed', 'false' );
			} );
			filterEl.querySelectorAll( '.e-filter-dropdown' ).forEach( function ( w ) {
				w.classList.remove( 'e-filter-dropdown--active-child' );
			} );
		}

		// Only process visible top-level buttons (exclude hidden child buttons)
		var buttons = Array.from(
			filterEl.querySelectorAll( '.e-filter-item[data-filter]:not(.e-filter-item--hidden-child)' )
		);

		// ── Build dropdown wrappers for parent buttons that have children ──────
		buttons.forEach( function ( btn ) {
			var slug = btn.getAttribute( 'data-filter' );
			if ( slug === '__all' || ! childrenMap[ slug ] ) return;

			var wrapper = document.createElement( 'div' );
			wrapper.className = 'e-filter-dropdown';
			filterEl.insertBefore( wrapper, btn );
			wrapper.appendChild( btn );

			var arrow = document.createElement( 'span' );
			arrow.className = 'e-filter-dropdown__arrow';
			arrow.setAttribute( 'aria-hidden', 'true' );
			btn.appendChild( arrow );

			var menu = document.createElement( 'div' );
			menu.className = 'e-filter-dropdown__menu';
			wrapper.appendChild( menu );

			// "View All" option — triggers the parent category filter
			var viewAllBtn = document.createElement( 'button' );
			viewAllBtn.className = 'e-filter-dropdown-child e-filter-dropdown-child--view-all';
			viewAllBtn.setAttribute( 'data-filter', slug );
			viewAllBtn.setAttribute( 'aria-pressed', 'false' );
			viewAllBtn.textContent = 'View All';

			viewAllBtn.addEventListener( 'click', function ( e ) {
				e.stopPropagation();
				resetFilterStore();
				clearAllSelections();
				btn.click();
			} );

			menu.appendChild( viewAllBtn );

			childrenMap[ slug ].forEach( function ( child ) {
				var childBtn = document.createElement( 'button' );
				// NOT 'e-filter-item' — prevents Elementor from binding its own
				// click handler which would cause a double-fire / toggle-off bug.
				childBtn.className = 'e-filter-dropdown-child';
				childBtn.setAttribute( 'data-filter',  child.slug );
				childBtn.setAttribute( 'aria-pressed', child.slug === activeChildSlug ? 'true' : 'false' );
				childBtn.textContent = child.name;

				childBtn.addEventListener( 'click', function ( e ) {
					e.stopPropagation();
					var childSlug = this.getAttribute( 'data-filter' );

					/*
					 * Clear the store BEFORE clicking so that any previously
					 * accumulated terms (from multi-select mode) are wiped out.
					 * Elementor's handler then sets ONLY the child slug.
					 */
					resetFilterStore();

					var hiddenBtn = filterEl.querySelector(
						'.e-filter-item--hidden-child[data-filter="' + childSlug + '"]'
					);
					if ( hiddenBtn ) {
						hiddenBtn.click();
					} else if (
						filterId && selectedElementId &&
						window.elementorProFrontend &&
						elementorProFrontend.modules &&
						elementorProFrontend.modules.taxonomyFilter &&
						typeof elementorProFrontend.modules.taxonomyFilter.setFilterDataForLoopWidget === 'function'
					) {
						elementorProFrontend.modules.taxonomyFilter.setFilterDataForLoopWidget(
							selectedElementId,
							filterId,
							{ filterType: 'taxonomy', filterData: { selectedTaxonomy: 'category', terms: [ childSlug ] } },
							true,
							'DISABLED'
						);
					}

					// Visual state: clear all children, mark this one, mark parent
					clearAllSelections();
					this.setAttribute( 'aria-pressed', 'true' );
					wrapper.classList.add( 'e-filter-dropdown--active-child' );
				} );

				menu.appendChild( childBtn );
			} );

			// Restore active-child indicator on page load (from URL)
			if ( activeChildSlug && childrenMap[ slug ].some( function ( c ) { return c.slug === activeChildSlug; } ) ) {
				btn.setAttribute( 'aria-pressed', 'true' );
				wrapper.classList.add( 'e-filter-dropdown--active-child' );
			}
		} );

		/*
		 * When any top-level filter button is clicked, clear child visual states
		 * AND reset the store before Elementor processes the click.
		 *
		 * Using capture=true so this fires BEFORE Elementor's bubble-phase
		 * jQuery handler — the store is empty by the time filterItems() runs,
		 * so the new term replaces instead of accumulates.
		 */
		filterEl.querySelectorAll( '.e-filter-item[data-filter]:not(.e-filter-item--hidden-child)' ).forEach( function ( topBtn ) {
			topBtn.addEventListener( 'click', function () {
				clearAllSelections();
				resetFilterStore();
			}, true ); // capture phase → fires before jQuery's bubble handler
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', buildDropdowns );
	} else {
		buildDropdowns();
	}
}() );
