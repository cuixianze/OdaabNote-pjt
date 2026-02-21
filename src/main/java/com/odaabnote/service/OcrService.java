package com.odaabnote.service;

import org.springframework.web.multipart.MultipartFile;

public interface OcrService {

    String extractTextFromImage(MultipartFile file);
}

