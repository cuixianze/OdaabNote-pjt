package com.odaabnote.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "gemini")
public class GeminiProperties {

    private String apiKey = "";
    private String model = "gemini-2.5-flash";
    private String generateContentUrl = "https://generativelanguage.googleapis.com/v1beta/models";

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getGenerateContentUrl() {
        return generateContentUrl;
    }

    public void setGenerateContentUrl(String generateContentUrl) {
        this.generateContentUrl = generateContentUrl;
    }
}
