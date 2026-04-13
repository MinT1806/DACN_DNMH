package com.luxury.ecommerce.service;

import com.luxury.ecommerce.dto.UserProfileRequest;
import com.luxury.ecommerce.entity.User;
import com.luxury.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public User updateProfile(Long userId, UserProfileRequest request) {
        User user = getUserById(userId);

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getStyle() != null) user.setStyle(request.getStyle());
        if (request.getFavoriteColor() != null) user.setFavoriteColor(request.getFavoriteColor());

        return userRepository.save(user);
    }

    public User toggleVipStatus(Long userId) {
        User user = getUserById(userId);
        user.setIsVip(!user.getIsVip());
        return userRepository.save(user);
    }

    public User toggleActiveStatus(Long userId) {
        User user = getUserById(userId);
        user.setIsActive(!user.getIsActive());
        return userRepository.save(user);
    }
}
