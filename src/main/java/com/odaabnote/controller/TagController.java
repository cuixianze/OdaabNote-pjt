package com.odaabnote.controller;

import com.odaabnote.dto.tag.TagCreateRequest;
import com.odaabnote.dto.tag.TagResponse;
import com.odaabnote.service.TagService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @Operation(summary = "태그 생성", description = "이름(name) 필수, color는 선택(UI용)")
    @PostMapping
    public ResponseEntity<TagResponse> createTag(@Valid @RequestBody TagCreateRequest request) {
        TagResponse response = tagService.createTag(request);
        return ResponseEntity.created(URI.create("/api/tags/" + response.id()))
                .body(response);
    }

    @Operation(summary = "태그 목록", description = "등록된 전체 태그 목록")
    @GetMapping
    public ResponseEntity<List<TagResponse>> listTags() {
        return ResponseEntity.ok(tagService.findAllTags());
    }

    @GetMapping("/{tagId}")
    public ResponseEntity<TagResponse> getTag(@PathVariable Long tagId) {
        return ResponseEntity.ok(tagService.getTag(tagId));
    }
}
