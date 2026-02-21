package com.odaabnote.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Embeddable
public class ExamProblemId implements Serializable {

    @Column(name = "exam_id")
    private Long examId;

    @Column(name = "problem_id")
    private Long problemId;

    public ExamProblemId(Long examId, Long problemId) {
        this.examId = examId;
        this.problemId = problemId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ExamProblemId that = (ExamProblemId) o;
        return Objects.equals(examId, that.examId) && Objects.equals(problemId, that.problemId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(examId, problemId);
    }
}

