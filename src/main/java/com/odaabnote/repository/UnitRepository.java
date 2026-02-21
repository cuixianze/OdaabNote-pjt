package com.odaabnote.repository;

import com.odaabnote.domain.Subject;
import com.odaabnote.domain.Unit;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UnitRepository extends JpaRepository<Unit, Long> {

    List<Unit> findBySubjectOrderByUnitOrderAsc(Subject subject);

    List<Unit> findBySubject_IdOrderByUnitOrderAsc(Long subjectId);

    Optional<Unit> findBySubject_IdAndName(Long subjectId, String name);
}

