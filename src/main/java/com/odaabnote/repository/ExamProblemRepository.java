package com.odaabnote.repository;

import com.odaabnote.domain.ExamProblem;
import com.odaabnote.domain.ExamProblemId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamProblemRepository extends JpaRepository<ExamProblem, ExamProblemId> {

    List<ExamProblem> findByExamIdOrderByQuestionNoAsc(Long examId);
}

