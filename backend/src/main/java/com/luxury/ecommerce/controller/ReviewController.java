package com.luxury.ecommerce.controller;

import com.luxury.ecommerce.dto.ApiResponse;
import com.luxury.ecommerce.dto.ReviewRequest;
import com.luxury.ecommerce.entity.Review;
import com.luxury.ecommerce.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<List<Review>>> getProductReviews(@PathVariable Long productId) {
        try {
            List<Review> reviews = reviewService.getReviewsByProduct(productId);
            return ResponseEntity.ok(ApiResponse.success(reviews));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Review>>> getUserReviews(@PathVariable Long userId) {
        try {
            List<Review> reviews = reviewService.getReviewsByUser(userId);
            return ResponseEntity.ok(ApiResponse.success(reviews));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Review>> createReview(
            @PathVariable Long userId,
            @RequestBody ReviewRequest request) {
        try {
            Review review = reviewService.createReview(userId, request.getProductId(),
                    request.getRating(), request.getComment());
            return ResponseEntity.ok(ApiResponse.success("Review created successfully", review));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Review>> updateReview(
            @PathVariable Long reviewId,
            @RequestBody ReviewRequest request) {
        try {
            Review review = reviewService.updateReview(reviewId, request.getRating(), request.getComment());
            return ResponseEntity.ok(ApiResponse.success("Review updated successfully", review));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Long reviewId) {
        try {
            reviewService.deleteReview(reviewId);
            return ResponseEntity.ok(ApiResponse.success("Review deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
