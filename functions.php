<?php

/**
 * Theme functions and definitions
 *
 * @package HelloElementor
 */

if (! defined('ABSPATH')) {
	exit; // Exit if accessed directly.
}

define('HELLO_ELEMENTOR_VERSION', '3.2.1');

if (! isset($content_width)) {
	$content_width = 800; // Pixels.
}

if (! function_exists('hello_elementor_setup')) {
	/**
	 * Set up theme support.
	 *
	 * @return void
	 */
	function hello_elementor_setup()
	{
		if (is_admin()) {
			hello_maybe_update_theme_version_in_db();
		}

		if (apply_filters('hello_elementor_register_menus', true)) {
			register_nav_menus(['menu-1' => esc_html__('Header', 'hello-elementor')]);
			register_nav_menus(['menu-2' => esc_html__('Footer', 'hello-elementor')]);
		}

		if (apply_filters('hello_elementor_post_type_support', true)) {
			add_post_type_support('page', 'excerpt');
		}

		if (apply_filters('hello_elementor_add_theme_support', true)) {
			add_theme_support('post-thumbnails');
			add_theme_support('automatic-feed-links');
			add_theme_support('title-tag');
			add_theme_support(
				'html5',
				[
					'search-form',
					'comment-form',
					'comment-list',
					'gallery',
					'caption',
					'script',
					'style',
				]
			);
			add_theme_support(
				'custom-logo',
				[
					'height'      => 100,
					'width'       => 350,
					'flex-height' => true,
					'flex-width'  => true,
				]
			);
			add_theme_support('align-wide');
			add_theme_support('responsive-embeds');

			/*
			 * Editor Styles
			 */
			add_theme_support('editor-styles');
			add_editor_style('editor-styles.css');

			/*
			 * WooCommerce.
			 */
			if (apply_filters('hello_elementor_add_woocommerce_support', true)) {
				// WooCommerce in general.
				add_theme_support('woocommerce');
				// Enabling WooCommerce product gallery features (are off by default since WC 3.0.0).
				// zoom.
				add_theme_support('wc-product-gallery-zoom');
				// lightbox.
				add_theme_support('wc-product-gallery-lightbox');
				// swipe.
				add_theme_support('wc-product-gallery-slider');
			}
		}
	}
}
add_action('after_setup_theme', 'hello_elementor_setup');

function hello_maybe_update_theme_version_in_db()
{
	$theme_version_option_name = 'hello_theme_version';
	// The theme version saved in the database.
	$hello_theme_db_version = get_option($theme_version_option_name);

	// If the 'hello_theme_version' option does not exist in the DB, or the version needs to be updated, do the update.
	if (! $hello_theme_db_version || version_compare($hello_theme_db_version, HELLO_ELEMENTOR_VERSION, '<')) {
		update_option($theme_version_option_name, HELLO_ELEMENTOR_VERSION);
	}
}

if (! function_exists('hello_elementor_display_header_footer')) {
	/**
	 * Check whether to display header footer.
	 *
	 * @return bool
	 */
	function hello_elementor_display_header_footer()
	{
		$hello_elementor_header_footer = true;

		return apply_filters('hello_elementor_header_footer', $hello_elementor_header_footer);
	}
}

if (! function_exists('hello_elementor_scripts_styles')) {
	/**
	 * Theme Scripts & Styles.
	 *
	 * @return void
	 */
	function hello_elementor_scripts_styles()
	{
		$min_suffix = defined('SCRIPT_DEBUG') && SCRIPT_DEBUG ? '' : '.min';

		if (apply_filters('hello_elementor_enqueue_style', true)) {
			wp_enqueue_style(
				'hello-elementor',
				get_template_directory_uri() . '/style' . $min_suffix . '.css',
				[],
				HELLO_ELEMENTOR_VERSION
			);
		}

		if (apply_filters('hello_elementor_enqueue_theme_style', true)) {
			wp_enqueue_style(
				'hello-elementor-theme-style',
				get_template_directory_uri() . '/theme' . $min_suffix . '.css',
				[],
				HELLO_ELEMENTOR_VERSION
			);
		}

		if (hello_elementor_display_header_footer()) {
			wp_enqueue_style(
				'hello-elementor-header-footer',
				get_template_directory_uri() . '/header-footer' . $min_suffix . '.css',
				[],
				HELLO_ELEMENTOR_VERSION
			);
		}
	}
}
add_action('wp_enqueue_scripts', 'hello_elementor_scripts_styles');

if (! function_exists('hello_elementor_register_elementor_locations')) {
	/**
	 * Register Elementor Locations.
	 *
	 * @param ElementorPro\Modules\ThemeBuilder\Classes\Locations_Manager $elementor_theme_manager theme manager.
	 *
	 * @return void
	 */
	function hello_elementor_register_elementor_locations($elementor_theme_manager)
	{
		if (apply_filters('hello_elementor_register_elementor_locations', true)) {
			$elementor_theme_manager->register_all_core_location();
		}
	}
}
add_action('elementor/theme/register_locations', 'hello_elementor_register_elementor_locations');

if (! function_exists('hello_elementor_content_width')) {
	/**
	 * Set default content width.
	 *
	 * @return void
	 */
	function hello_elementor_content_width()
	{
		$GLOBALS['content_width'] = apply_filters('hello_elementor_content_width', 800);
	}
}
add_action('after_setup_theme', 'hello_elementor_content_width', 0);

if (! function_exists('hello_elementor_add_description_meta_tag')) {
	/**
	 * Add description meta tag with excerpt text.
	 *
	 * @return void
	 */
	function hello_elementor_add_description_meta_tag()
	{
		if (! apply_filters('hello_elementor_description_meta_tag', true)) {
			return;
		}

		if (! is_singular()) {
			return;
		}

		$post = get_queried_object();
		if (empty($post->post_excerpt)) {
			return;
		}

		echo '<meta name="description" content="' . esc_attr(wp_strip_all_tags($post->post_excerpt)) . '">' . "\n";
	}
}
add_action('wp_head', 'hello_elementor_add_description_meta_tag');

// Admin notice
if (is_admin()) {
	require get_template_directory() . '/includes/admin-functions.php';
}

// Settings page
require get_template_directory() . '/includes/settings-functions.php';

// Header & footer styling option, inside Elementor
require get_template_directory() . '/includes/elementor-functions.php';

if (! function_exists('hello_elementor_customizer')) {
	// Customizer controls
	function hello_elementor_customizer()
	{
		if (! is_customize_preview()) {
			return;
		}

		if (! hello_elementor_display_header_footer()) {
			return;
		}

		require get_template_directory() . '/includes/customizer-functions.php';
	}
}
add_action('init', 'hello_elementor_customizer');

if (! function_exists('hello_elementor_check_hide_title')) {
	/**
	 * Check whether to display the page title.
	 *
	 * @param bool $val default value.
	 *
	 * @return bool
	 */
	function hello_elementor_check_hide_title($val)
	{
		if (defined('ELEMENTOR_VERSION')) {
			$current_doc = Elementor\Plugin::instance()->documents->get(get_the_ID());
			if ($current_doc && 'yes' === $current_doc->get_settings('hide_title')) {
				$val = false;
			}
		}
		return $val;
	}
}
add_filter('hello_elementor_page_title', 'hello_elementor_check_hide_title');

/**
 * BC:
 * In v2.7.0 the theme removed the `hello_elementor_body_open()` from `header.php` replacing it with `wp_body_open()`.
 * The following code prevents fatal errors in child themes that still use this function.
 */
if (! function_exists('hello_elementor_body_open')) {
	function hello_elementor_body_open()
	{
		wp_body_open();
	}
}

// Block direct access to comment posting
add_action('init', function () {
	if (isset($_SERVER['SCRIPT_FILENAME']) && basename($_SERVER['SCRIPT_FILENAME']) === 'wp-comments-post.php') {
		wp_die('Comments are disabled.');
	}
});

// Shortcode: builds a link to the first "Project categories" term of the current post.
function term_link_shortcode()
{
	$terms = get_the_terms(get_the_ID(), 'project-category');
	if (! empty($terms) && ! is_wp_error($terms)) {
		$slug = sanitize_title($terms[0]->slug);
		return '/sectors/' . $slug . '/';
	}
	return '';
}

add_shortcode('term_link', 'term_link_shortcode');

function sector_title_link_shortcode()
{
	$terms = get_the_terms(get_the_ID(), 'project-category');
	if (! empty($terms) && ! is_wp_error($terms)) {
		$term = $terms[0];
		$slug = sanitize_title($term->slug);
		$name = $term->name;
		$url  = esc_url(home_url('/' . $slug . '/'));
		return '<a href="' . $url . '">' . esc_html($name) . '</a>';
	}
	return '';
}
add_shortcode('sector_title_link', 'sector_title_link_shortcode');

function sector_title_link_blank_shortcode()
{
	$terms = get_the_terms(get_the_ID(), 'project-category');
	if (! empty($terms) && ! is_wp_error($terms)) {
		$term = $terms[0];
		$slug = sanitize_title($term->slug);
		$name = $term->name;
		$url  = esc_url(home_url('/' . $slug . '/'));
		return '<a target="_BLANK" href="' . $url . '">' . esc_html($name) . '</a>';
	}
	return '';
}
add_shortcode('sector_title_link_blank', 'sector_title_link_blank_shortcode');

function sector_title_link_button_shortcode()
{
	$terms = get_the_terms(get_the_ID(), 'project-category');
	if (! empty($terms) && ! is_wp_error($terms)) {
		$term = $terms[0];
		$slug = sanitize_title($term->slug);
		$name = $term->name;
		$url  = esc_url(home_url('/' . $slug . '/'));
		return '<a target="_BLANK" href="' . $url . '" class="elementor-button-link elementor-button elementor-size-sm" role="button"> <span class="elementor-button-content-wrapper"> <span class="elementor-button-text">'.  __(sprintf('Explore %s' , esc_html($name))) . '</span> </span></a>';
	}
	return '';
}
add_shortcode('sector_title_link_button', 'sector_title_link_button_shortcode');

function kendoo_get_news_thumbnail()
{
	$alt = get_field('alternative_thumbnail');

	if (is_array($alt) && !empty($alt['url'])) {
		echo esc_url($alt['url']);
		return;
	}

	$featured = get_the_post_thumbnail_url();
	if ($featured) {
		echo esc_url($featured);
		return;
	}
}

function kendoo_news_thumbnail_shortcode()
{
	$alt = get_field('alternative_thumbnail');

	if (is_array($alt) && !empty($alt['url'])) {
		return esc_url($alt['url']);
	}

	$featured = get_the_post_thumbnail_url();
	if ($featured) {
		return esc_url($featured);
	}

	return '';
}
add_shortcode('news_thumbnail', 'kendoo_news_thumbnail_shortcode');

add_filter('elementor/widget/image/print_template', function ($template, $widget) {
	if (!isset($widget->get_data()['id'])) return $template;

	// Your widget ID
	if ($widget->get_data()['id'] === '8aac132') {

		$custom_url = do_shortcode('[news_thumbnail]');

		if (!empty($custom_url)) {
			$template = preg_replace(
				'/src="[^"]*"/',
				'src="' . esc_url($custom_url) . '"',
				$template
			);
		}
	}

	return $template;
}, 10, 2);


add_filter('post_thumbnail_html', function ($html, $post_id, $post_thumbnail_id, $size, $attr) {

	$alt = get_field('alternative_thumbnail', $post_id);

	if (is_array($alt) && !empty($alt['id'])) {
		// Return alternative image instead of featured
		return wp_get_attachment_image($alt['id'], $size, false, $attr);
	}

	return $html;
}, 10, 5);

add_filter('post_thumbnail_id', function ($thumb_id) {
	$alt = get_field('alternative_thumbnail');
	if (is_array($alt) && !empty($alt['id'])) {
		return $alt['id'];
	}
	return $thumb_id;
});

add_filter('elementor_pro/posts/skin_global/image_enabled', function ($enabled, $settings) {
	return false;
}, 10, 2);

add_filter('post_thumbnail_html', '__return_empty_string', 20);

add_filter('pre_get_posts', function ($q) {
	add_filter('post_thumbnail_html', function ($html) {
		if (did_action('elementor_pro/posts_skin_render')) {
			return '';
		}
		return $html;
	}, 20);
});

function render_conditional_image_shortcode()
{
	$post_id = get_the_ID();

	// 1. Get the Alternative Image URL
	$image_url = get_field('alternative_thumbnail', $post_id);

	// Check if $image_url is a non-empty string (URL return format)
	if (is_string($image_url) && !empty($image_url)) {
		$final_url = esc_url($image_url);
		$alt_text = esc_attr(get_the_title($post_id) . ' alternative');
	} else {
		// 2. Fallback to Featured Image (requesting 'full' size)
		$final_url = esc_url(get_the_post_thumbnail_url($post_id, 'full'));
		$alt_text = esc_attr(get_the_title($post_id));
	}

	// 3. Define the minimal, essential classes for Elementor styling
	$classes = 'elementor-image';

	// 4. Return the full HTML <img> tag
	if ($final_url) {
		// We use an inline style to ensure it fills the Shortcode Widget container
		return '<img src="' . $final_url . '" alt="' . $alt_text . '" class="' . $classes . '" style="width: 100%; height: auto;">';
	}

	return '';
}


// Register the shortcode we will use in Elementor
add_shortcode('conditional_img', 'render_conditional_image_shortcode');

/**
 * Exclude "Uncategorized" (ID 1) from the Elementor Taxonomy Filter widget.
 */
add_filter( 'get_terms_args', function( $args, $taxonomies ) {
    // Check if we are filtering the 'category' taxonomy
    if ( in_array( 'category', (array) $taxonomies ) ) {
        // Add ID 1 to the exclusion list
        if ( ! empty( $args['exclude'] ) ) {
            $exclude = (array) $args['exclude'];
            $exclude[] = 1;
            $args['exclude'] = array_unique( $exclude );
        } else {
            $args['exclude'] = [1];
        }
    }
    return $args;
}, 10, 2 );
