package com.odaabnote.dto.exam;

import jakarta.validation.constraints.Min;

public record CreateRandomExamRequest(
        /** null이면 전체 문제에서 랜덤, 있으면 해당 과목에서만 랜덤 */
        Long subjectId,
        /** 선택. 없으면 생성자 없이 저장 */
        Long createdByUserId,
        @Min(1) int count
) {
}

