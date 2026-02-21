package com.odaabnote.dto.user;

import com.odaabnote.domain.User;
import com.odaabnote.domain.UserRole;

public record UserResponse(
        Long id,
        String email,
        String name,
        UserRole role
) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole()
        );
    }
}

