package com.odaabnote.repository;

import com.odaabnote.domain.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    /** 이름 부분 일치 검색 (빈 문자열이면 사용하지 않음) */
    List<User> findByNameContainingIgnoreCase(String name);
}

