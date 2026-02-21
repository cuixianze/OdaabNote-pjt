package com.odaabnote.repository;

import com.odaabnote.domain.Comment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByProblemIdOrderByCreatedAtAsc(Long problemId);
}

