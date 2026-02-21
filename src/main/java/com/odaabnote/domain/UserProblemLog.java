package com.odaabnote.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "user_problem_log")
public class UserProblemLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id")
    private Exam exam;

    @Column(name = "selected_choice_key", length = 20)
    private String selectedChoiceKey;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "solved_at", nullable = false)
    private LocalDateTime solvedAt;

    public UserProblemLog(
            User user,
            Problem problem,
            Exam exam,
            String selectedChoiceKey,
            Boolean isCorrect,
            String memo,
            LocalDateTime solvedAt
    ) {
        this.user = user;
        this.problem = problem;
        this.exam = exam;
        this.selectedChoiceKey = selectedChoiceKey;
        this.isCorrect = isCorrect;
        this.memo = memo;
        this.solvedAt = solvedAt;
    }
}

