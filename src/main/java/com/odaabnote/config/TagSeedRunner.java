package com.odaabnote.config;

import com.odaabnote.service.TagService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** 앱 기동 시 고정 태그 5개가 없으면 생성 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class TagSeedRunner implements ApplicationRunner {

    private static final List<String> DEFAULT_TAG_NAMES = List.of(
            "초빈출",
            "별표100개",
            "지엽적",
            "기출",
            "통암기"
    );

    private final TagService tagService;

    @Override
    public void run(ApplicationArguments args) {
        for (String name : DEFAULT_TAG_NAMES) {
            try {
                tagService.findOrCreateByName(name);
            } catch (Exception e) {
                log.warn("Tag seed skip (already exists or error): {}", name, e);
            }
        }
    }
}
