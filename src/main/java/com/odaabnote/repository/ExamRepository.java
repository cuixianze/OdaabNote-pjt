package com.odaabnote.repository;

import com.odaabnote.domain.Exam;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamRepository extends JpaRepository<Exam, Long> {
}

