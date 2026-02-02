<?php
/*
Plugin Name: WooMate AI Connector
Description: Conectează magazinul WooCommerce la WooMate AI și trimite date despre recomandări.
Version: 1.1
Author: Andrei Calugaru
*/

if (!defined('ABSPATH')) exit;

// Injectează store ID și URL backend în frontend
add_action('wp_head', function() {
    $store_id = get_bloginfo('url'); // URL magazin ca storeId
    $backend_url = 'hhttps://woomate.onrender.com'; // schimbă cu URL-ul tău Render
    echo "<script>
        window.__WOOMATE_STORE_ID = '$store_id';
        window.__WOOMATE_BACKEND = '$backend_url';
    </script>";
});

// Hook pentru finalizare comandă
add_action('woocommerce_order_status_completed', function($order_id){
    $order = wc_get_order($order_id);
    $items = $order->get_items();

    $ai_generated = []; // aici putem adăuga logica pentru ce recomandări AI au dus la aceste produse

    foreach($items as $item){
        $product_name = $item->get_name();
        $quantity = $item->get_quantity();
        $ai_generated[] = ['product' => $product_name, 'quantity' => $quantity];
    }

    // Trimite date la backend
    $store_id = get_bloginfo('url');
    $payload = json_encode([
        'storeId' => $store_id,
        'orderId' => $order_id,
        'aiGenerated' => $ai_generated
    ]);

    $backend_url = 'https://backend-woomate-ai.example.com/track-sale'; // endpoint backend
    wp_remote_post($backend_url, [
        'headers' => ['Content-Type' => 'application/json'],
        'body' => $payload
    ]);
});
