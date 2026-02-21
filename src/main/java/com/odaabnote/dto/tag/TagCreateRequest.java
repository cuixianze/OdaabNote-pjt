package com.odaabnote.dto.tag;

import jakarta.validation.constraints.NotBlank;

public record TagCreateRequest(
        @NotBlank String name,
        String color
) {
}
