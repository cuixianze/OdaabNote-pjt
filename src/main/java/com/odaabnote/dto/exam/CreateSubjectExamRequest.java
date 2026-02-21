package com.odaabnote.dto.exam;

import jakarta.validation.constraints.NotNull;

/** 과목별 모의고사 생성. 단원당 2~3문항, 최대 20제. */
public record CreateSubjectExamRequest(
        @NotNull Long subjectId,
        /** 선택. 없으면 생성자 없이 저장 */
        Long createdByUserId
) {
}
