package com.example.activities.service;

import com.example.activities.model.NotificationSetting;
import com.example.activities.repository.NotificationSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationSettingService {

    private final NotificationSettingRepository repository;

    public List<NotificationSetting> findAll() {
        return repository.findAll();
    }

    public NotificationSetting findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("NotificationSetting not found"));
    }

    public NotificationSetting save(NotificationSetting entity) {
        return repository.save(entity);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }
}