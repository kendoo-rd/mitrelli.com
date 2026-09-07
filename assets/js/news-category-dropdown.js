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
			if ( ! mod || ! mod.loopWidgetsStore || ! selectedElementId || ! filterId ) {
				return;
			}

			var store = mod.loopWidgetsStore;
			if ( typeof store.unsetFilter !== 'function' || typeof store.getWidget !== 'function' ) {
				return;
			}

			/*
			 * The widget is only registered in the store once a filter has been
			 * applied at least once. Before that, getWidget() returns undefined
			 * and unsetFilter() — which does
			 *   delete this.getWidget( widgetId ).filters[ filterId ]
			 * — throws "Cannot read properties of undefined (reading 'filters')".
			 *
			 * That exception used to escape this function and abort the calling
			 * click handler before it ever triggered the filter, so the FIRST
			 * dropdown selection after a page load silently did nothing.
			 * Elementor guards the same call the same way (elements-handlers.js:599).
			 */
			var widget = store.getWidget( selectedElementId );
			if ( ! widget || ! widget.filters ) {
				return; // Nothing stored yet — nothing to reset.
			}

			try {
				store.unsetFilter( selectedElementId, filterId );
			} catch ( e ) {
				// A stale filter term is recoverable; a dead click handler is not.
			}
		}

		// Reset all visual filter states: dropdown children, parent indicators,
		// and top-level buttons (needed when Elementor runs in multiple-selection
		// mode, where activateFilterButton() skips its "reset all" step and
		// leaves the previously active top-level button still marked).
		//
		// The hidden child buttons MUST be reset too. Elementor decides between
		// select and deselect in onFilterButtonClick() by testing whether the
		// clicked slug is already in getCurrentlyActiveFilter(), which is derived
		// purely from [aria-pressed="true"]. With multiple_selection enabled,
		// activateFilterButton() skips its "reset every button" branch, so a
		// hidden button stays pressed after its first click — and the next click
		// on that same volume is read as a deselect and clears the filter instead
		// of applying it. Clearing them here makes every click an activate.
		function clearAllSelections() {
			filterEl.querySelectorAll( '.e-filter-item[data-filter]:not(.e-filter-item--hidden-child)' ).forEach( function ( b ) {
				b.setAttribute( 'aria-pressed', 'false' );
			} );
			filterEl.querySelectorAll( '.e-filter-item--hidden-child' ).forEach( function ( b ) {
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
					 * Clear the store AND every aria-pressed state BEFORE
					 * clicking, so any previously accumulated terms (from
					 * multi-select mode) are wiped out and Elementor reads the
					 * click as a fresh selection rather than a toggle-off.
					 * Elementor's handler then sets ONLY the child slug.
					 */
					resetFilterStore();
					clearAllSelections();

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

					// Visual state: mark this one and its parent. Elementor has
					// just pressed the matching hidden button; that is left as-is
					// and cleared on the next click.
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
