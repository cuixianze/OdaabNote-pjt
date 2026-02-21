package com.odaabnote.dto.tag;

import com.odaabnote.domain.Tag;

public record TagResponse(
        Long id,
        String name,
        String color
) {
    public static TagResponse from(Tag tag) {
        return new TagResponse(tag.getId(), tag.getName(), tag.getColor());
    }
}
