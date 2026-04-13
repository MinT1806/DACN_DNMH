package com.luxury.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileRequest {
    private String firstName;
    private String lastName;
    private String gender;
    private String style;
    private String favoriteColor;
}
