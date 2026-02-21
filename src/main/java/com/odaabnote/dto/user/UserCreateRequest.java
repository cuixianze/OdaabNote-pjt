package com.odaabnote.dto.user;

import com.odaabnote.domain.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserCreateRequest(
        @NotBlank @Email String email,
        @NotBlank String name,
        UserRole role
) {
}

