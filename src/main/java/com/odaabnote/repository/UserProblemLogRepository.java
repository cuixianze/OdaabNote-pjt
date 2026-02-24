package com.odaabnote.repository;

import com.odaabnote.domain.UserProblemLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProblemLogRepository extends JpaRepository<UserProblemLog, Long> {

    List<UserProblemLog> findByProblem_Id(Long problemId);
}

