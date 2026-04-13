package com.luxury.ecommerce.controller;

import com.luxury.ecommerce.dto.ApiResponse;
import com.luxury.ecommerce.dto.ChatRequest;
import com.luxury.ecommerce.dto.ChatResponse;
import com.luxury.ecommerce.entity.ChatHistory;
import com.luxury.ecommerce.entity.User;
import com.luxury.ecommerce.repository.UserRepository;
import com.luxury.ecommerce.service.AiStylistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai-stylist")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AiStylistController {

    @Autowired
    private AiStylistService aiStylistService;

    @Autowired
    private UserRepository userRepository;

    private Long resolveAuthenticatedUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Unauthorized");
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getId();
    }

    @PostMapping("/chat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ChatResponse>> chatCurrentUser(
            @RequestBody ChatRequest request,
            Authentication authentication) {
        try {
            Long userId = resolveAuthenticatedUserId(authentication);
            ChatResponse response = aiStylistService.generateRecommendation(userId, request.getPrompt());
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/user/{userId}/chat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @PathVariable Long userId,
            @RequestBody ChatRequest request,
            Authentication authentication) {
        try {
            Long authenticatedUserId = resolveAuthenticatedUserId(authentication);
            ChatResponse response = aiStylistService.generateRecommendation(authenticatedUserId, request.getPrompt());
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> clearCurrentUserHistory(Authentication authentication) {
        try {
            Long userId = resolveAuthenticatedUserId(authentication);
            aiStylistService.clearHistory(userId);
            return ResponseEntity.ok(ApiResponse.success("Chat history cleared", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ChatHistory>>> getCurrentUserChatHistory(Authentication authentication) {
        try {
            Long userId = resolveAuthenticatedUserId(authentication);
            List<ChatHistory> history = aiStylistService.getChatHistory(userId);
            return ResponseEntity.ok(ApiResponse.success(history));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ChatHistory>>> getChatHistory(
            @PathVariable Long userId,
            Authentication authentication) {
        try {
            Long authenticatedUserId = resolveAuthenticatedUserId(authentication);
            List<ChatHistory> history = aiStylistService.getChatHistory(authenticatedUserId);
            return ResponseEntity.ok(ApiResponse.success(history));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
