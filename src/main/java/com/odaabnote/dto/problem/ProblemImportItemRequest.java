package com.odaabnote.dto.problem;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * 기출문제 등 JSON으로 한 문제를 DB에 넣을 때 사용.
 * subjectName/unitName/tagNames는 DB에 있는 이름으로 넣으면 ID로 자동 매핑됩니다.
 */
public record ProblemImportItemRequest(
        @NotBlank String questionText,
        @NotNull @Valid List<ProblemChoiceDto> choices,
        @NotBlank String correctChoiceKey,

        String explanation,
        List<ProblemResponse.ChoiceExplanationDto> choiceExplanations,
        String coreConcept,
        List<String> keyConcepts,

        String subjectName,
        String unitName,
        List<String> tagNames,

        String source,
        Integer difficulty
) {
}
