package com.odaabnote.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(
        name = "exam_problem",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_exam_question_no",
                columnNames = {"exam_id", "question_no"}
        )
)
public class ExamProblem {

    @EmbeddedId
    private ExamProblemId id;

    @MapsId("examId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @MapsId("problemId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(name = "question_no", nullable = false)
    private Integer questionNo;

    public ExamProblem(Exam exam, Problem problem, Integer questionNo) {
        this.id = new ExamProblemId();
        this.exam = exam;
        this.problem = problem;
        this.questionNo = questionNo;
    }
}

