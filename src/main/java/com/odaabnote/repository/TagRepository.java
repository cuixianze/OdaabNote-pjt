package com.odaabnote.repository;

import com.odaabnote.domain.Tag;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findByIdIn(Iterable<Long> ids);

    Optional<Tag> findByName(String name);
}

