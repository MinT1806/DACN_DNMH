package com.luxury.ecommerce.controller;

import com.luxury.ecommerce.dto.ApiResponse;
import com.luxury.ecommerce.entity.Wishlist;
import com.luxury.ecommerce.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "*", maxAge = 3600)
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Wishlist>>> getUserWishlist(@PathVariable Long userId) {
        try {
            List<Wishlist> wishlist = wishlistService.getWishlistByUser(userId);
            return ResponseEntity.ok(ApiResponse.success(wishlist));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/user/{userId}/product/{productId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Wishlist>> addToWishlist(
            @PathVariable Long userId,
            @PathVariable Long productId) {
        try {
            Wishlist wishlist = wishlistService.addToWishlist(userId, productId);
            return ResponseEntity.ok(ApiResponse.success("Added to wishlist", wishlist));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/user/{userId}/product/{productId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            @PathVariable Long userId,
            @PathVariable Long productId) {
        try {
            wishlistService.removeFromWishlist(userId, productId);
            return ResponseEntity.ok(ApiResponse.success("Removed from wishlist", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}/product/{productId}/check")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkWishlist(
            @PathVariable Long userId,
            @PathVariable Long productId) {
        try {
            boolean inWishlist = wishlistService.isInWishlist(userId, productId);
            return ResponseEntity.ok(ApiResponse.success(Map.of("inWishlist", inWishlist)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
