package com.odaabnote.repository;

import com.odaabnote.domain.Problem;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProblemRepository extends JpaRepository<Problem, Long> {

    List<Problem> findByUnitId(Long unitId);

    /** 유저(소유자)별 등록 문제 목록 */
    List<Problem> findByOwner_Id(Long ownerId);

    /** 과목별 문제 목록 */
    List<Problem> findBySubjectId(Long subjectId);

    /** 태그 하나로 걸린 문제 목록 (태그별 검색). tags 컬렉션까지 fetch 해서 응답에 모든 태그가 나오도록 함 */
    @Query("SELECT DISTINCT p FROM Problem p LEFT JOIN FETCH p.tags WHERE p.id IN (SELECT p2.id FROM Problem p2 JOIN p2.tags t WHERE t.id = :tagId)")
    List<Problem> findByTagIdWithTags(@Param("tagId") Long tagId);

    @Query(
            value = "SELECT * FROM problem WHERE subject_id = :subjectId ORDER BY RAND()",
            nativeQuery = true
    )
    List<Problem> findRandomBySubjectId(@Param("subjectId") Long subjectId, Pageable pageable);

    /** 단원별 랜덤 문제 (시험용) */
    @Query(
            value = "SELECT * FROM problem WHERE unit_id = :unitId ORDER BY RAND()",
            nativeQuery = true
    )
    List<Problem> findRandomByUnitId(@Param("unitId") Long unitId, Pageable pageable);
}

