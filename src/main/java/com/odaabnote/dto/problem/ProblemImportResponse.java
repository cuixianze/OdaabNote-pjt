package com.odaabnote.dto.problem;

import java.util.List;

/** 기출문제 일괄 등록 결과 */
public record ProblemImportResponse(
        int createdCount,
        List<Long> createdIds
) {
}
