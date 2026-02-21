package com.odaabnote.dto.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CommentCreateRequest(
        @NotNull @Positive(message = "userId는 1 이상이어야 합니다") Long userId,
        @NotBlank String content
) {
}
