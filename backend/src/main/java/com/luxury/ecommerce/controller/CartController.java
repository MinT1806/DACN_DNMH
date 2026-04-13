package com.luxury.ecommerce.controller;

import com.luxury.ecommerce.dto.ApiResponse;
import com.luxury.ecommerce.dto.CartItemRequest;
import com.luxury.ecommerce.entity.Cart;
import com.luxury.ecommerce.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Cart>> getCart(@PathVariable Long userId) {
        try {
            Cart cart = cartService.getCartByUserId(userId);
            return ResponseEntity.ok(ApiResponse.success(cart));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/user/{userId}/items")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Cart>> addItemToCart(
            @PathVariable Long userId,
            @RequestBody CartItemRequest request) {
        try {
            Cart cart = cartService.addItemToCart(userId, request.getProductId(), request.getQuantity());
            return ResponseEntity.ok(ApiResponse.success("Item added to cart", cart));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/user/{userId}/items/{itemId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Cart>> updateCartItem(
            @PathVariable Long userId,
            @PathVariable Long itemId,
            @RequestBody CartItemRequest request) {
        try {
            Cart cart = cartService.updateCartItem(userId, itemId, request.getQuantity());
            return ResponseEntity.ok(ApiResponse.success("Cart updated", cart));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/user/{userId}/items/{itemId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Cart>> removeItemFromCart(
            @PathVariable Long userId,
            @PathVariable Long itemId) {
        try {
            Cart cart = cartService.removeItemFromCart(userId, itemId);
            return ResponseEntity.ok(ApiResponse.success("Item removed from cart", cart));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/user/{userId}/clear")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> clearCart(@PathVariable Long userId) {
        try {
            cartService.clearCart(userId);
            return ResponseEntity.ok(ApiResponse.success("Cart cleared", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
