package com.example.activities.service;

import com.example.activities.model.Notification;
import com.example.activities.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repository;

    public List<Notification> findAll() {
        return repository.findAll();
    }

    public Notification findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Notification not found"));
    }

    public Notification save(Notification entity) {
        return repository.save(entity);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }
}