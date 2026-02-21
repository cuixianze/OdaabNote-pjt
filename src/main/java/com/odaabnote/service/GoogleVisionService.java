package com.odaabnote.service;

import com.google.cloud.vision.v1.AnnotateImageRequest;
import com.google.cloud.vision.v1.AnnotateImageResponse;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.Feature;
import com.google.cloud.vision.v1.Image;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.TextAnnotation;
import com.google.protobuf.ByteString;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleVisionService implements OcrService {

    private final ImageAnnotatorClient imageAnnotatorClient;

    @Override
    public String extractTextFromImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return "";
        }

        try {
            ByteString imgBytes = ByteString.copyFrom(file.getBytes());
            Image img = Image.newBuilder().setContent(imgBytes).build();

            Feature feature = Feature.newBuilder()
                    .setType(Feature.Type.TEXT_DETECTION)
                    .build();

            AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                    .setImage(img)
                    .addFeatures(feature)
                    .build();

            BatchAnnotateImagesResponse batchResponse =
                    imageAnnotatorClient.batchAnnotateImages(List.of(request));

            List<AnnotateImageResponse> responses = batchResponse.getResponsesList();
            if (responses.isEmpty()) {
                log.warn("Google Vision returned empty responses for file: {}", file.getOriginalFilename());
                return "";
            }

            AnnotateImageResponse response = responses.get(0);
            if (response.hasError()) {
                log.error("Error from Google Vision API: {}", response.getError().getMessage());
                return "";
            }

            TextAnnotation annotation = response.getFullTextAnnotation();
            if (annotation == null) {
                log.warn("No full text annotation returned for file: {}", file.getOriginalFilename());
                return "";
            }

            return annotation.getText();
        } catch (IOException e) {
            log.error("Failed to read image file for OCR: {}", file.getOriginalFilename(), e);
            return "";
        } catch (Exception e) {
            log.error("Google Vision API call failed for file: {}", file.getOriginalFilename(), e);
            return "";
        }
    }
}

