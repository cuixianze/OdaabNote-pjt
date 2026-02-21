package com.odaabnote.repository;

import com.odaabnote.domain.UserProblemLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProblemLogRepository extends JpaRepository<UserProblemLog, Long> {
}

