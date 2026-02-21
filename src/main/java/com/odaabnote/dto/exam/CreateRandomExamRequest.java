package com.odaabnote.dto.exam;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateRandomExamRequest(
        @NotNull Long subjectId,
        /** 선택. 없으면 생성자 없이 저장 */
        Long createdByUserId,
        @Min(1) int count
) {
}

