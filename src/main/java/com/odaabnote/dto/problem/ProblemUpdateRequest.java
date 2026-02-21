package com.odaabnote.dto.problem;

import jakarta.validation.constraints.NotNull;
import java.util.List;

/** 본인이 등록한 문제 수정 시 사용. ownerUserId는 본인 확인용으로 필수. */
public record ProblemUpdateRequest(
        @NotNull Long ownerUserId,

        @NotNull Long subjectId,
        @NotNull Long unitId,

        String questionText,
        List<ProblemChoiceDto> choices,
        /** null이면 기존 유지 */
        String correctChoiceKey,

        String explanation,
        /** 선지별 해설. 없으면 기존 유지 */
        List<ProblemResponse.ChoiceExplanationDto> choiceExplanations,
        /** 핵심 개념 요약. 없으면 기존 유지 */
        String coreConcept,
        /** AI 추출 핵심 개념 목록. 없으면 기존 유지 */
        List<String> keyConcepts,
        Integer difficulty,
        String source,

        /** DB에 등록된 태그 ID 목록만 사용 (GET /api/tags 목록에서 선택) */
        List<Long> tagIds
) {
}
