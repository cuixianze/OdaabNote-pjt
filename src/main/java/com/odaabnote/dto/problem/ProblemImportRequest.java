package com.odaabnote.dto.problem;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/** 기출문제 일괄 등록 요청. ownerUserId 없으면 1로 처리 */
public record ProblemImportRequest(
        Long ownerUserId,
        @NotNull @Valid List<ProblemImportItemRequest> problems
) {
}
