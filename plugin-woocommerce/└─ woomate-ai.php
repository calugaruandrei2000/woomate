<?php
/*
Plugin Name: WooMate AI Connector
Description: Conectează magazinul WooCommerce la WooMate AI.
Version: 1.0
Author: Andrei Calugaru
*/

if (!defined('ABSPATH')) exit;

// Injecteaza store ID în frontend
add_action('wp_head', function() {
    if (is_user_logged_in()) {
        $store_id = get_bloginfo('url'); // URL magazin ca storeId
        echo "<script>window.__WOOMATE_STORE_ID = '$store_id';</script>";
    }
});

// Shortcode pentru dashboard
add_shortcode('woomate_dashboard', function() {
    return '<iframe src="https://dashboard.woomate.ai/dashboard.html?store=' . get_bloginfo('url') . '" style="width:100%;height:800px;border:none;"></iframe>';
});
