package com.odaabnote.service;

import com.odaabnote.domain.Tag;
import com.odaabnote.dto.tag.TagCreateRequest;
import com.odaabnote.dto.tag.TagResponse;
import com.odaabnote.repository.TagRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TagService {

    private final TagRepository tagRepository;

    @Transactional
    public TagResponse createTag(TagCreateRequest request) {
        Tag tag = new Tag(request.name(), request.color());
        Tag saved = tagRepository.save(tag);
        return TagResponse.from(saved);
    }

    public List<TagResponse> findAllTags() {
        return tagRepository.findAll().stream()
                .map(TagResponse::from)
                .toList();
    }

    public TagResponse getTag(Long tagId) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + tagId));
        return TagResponse.from(tag);
    }

    /** 이름으로 태그 조회, 없으면 생성 후 반환 */
    @Transactional
    public Tag findOrCreateByName(String name) {
        if (name == null || name.isBlank()) return null;
        String trimmed = name.trim();
        return tagRepository.findByName(trimmed)
                .orElseGet(() -> tagRepository.save(new Tag(trimmed, null)));
    }
}
