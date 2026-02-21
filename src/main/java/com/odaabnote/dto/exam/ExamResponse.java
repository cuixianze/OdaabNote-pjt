package com.odaabnote.dto.exam;

import com.odaabnote.domain.Exam;
import com.odaabnote.domain.ExamProblem;
import com.odaabnote.domain.ExamType;
import java.util.List;

public record ExamResponse(
        Long id,
        String title,
        ExamType type,
        Long subjectId,
        Long unitId,
        int questionCount,
        List<ExamProblemSummary> problems
) {

    public static ExamResponse from(Exam exam, List<ExamProblem> examProblems) {
        var problemSummaries = examProblems.stream()
                .map(ep -> new ExamProblemSummary(
                        ep.getProblem().getId(),
                        ep.getQuestionNo()
                ))
                .toList();

        return new ExamResponse(
                exam.getId(),
                exam.getTitle(),
                exam.getType(),
                exam.getSubject() != null ? exam.getSubject().getId() : null,
                exam.getUnit() != null ? exam.getUnit().getId() : null,
                exam.getQuestionCount(),
                problemSummaries
        );
    }
}

